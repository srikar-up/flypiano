"""
Continuous Auditory Pitch & Harmonic Feature Extractor (YIN + 12-Chroma + RMS)
=============================================================================
Matches the exact JavaScript YIN implementation in app.js for end-to-end consistency
between browser audio ingestion and PyTorch model training.

Extracts a 14-D continuous biological auditory perception vector:
- [0]: Continuous pitch cue: log2(f0 / 440.0), clamped [-4.0, 4.0], or 0.0 if unvoiced/rest
- [1:13]: 12-bin chromatic harmonic energy distribution (C, C#, D, ..., B)
- [13]: Continuous RMS energy (signal loudness / strike velocity proxy)
"""

import numpy as np

def yin_pitch_detect(signal_chunk: np.ndarray, sample_rate: int = 22050, 
                     min_freq: float = 27.5, max_freq: float = 4186.0,
                     threshold: float = 0.15) -> float:
    """
    Reimplements the exact windowed, normalized, parabolic-interpolated YIN algorithm
    as defined in app.js:detectPitchAutocorrelation.
    """
    size = len(signal_chunk)
    half_size = size // 2

    # Minimum and maximum lag periods corresponding to 27.5 Hz (A0) and 4186 Hz (C8)
    min_period = max(4, int(sample_rate / max_freq))
    max_period = min(int(sample_rate / min_freq), half_size)

    if max_period <= min_period or size < 256:
        return 0.0

    # 1. Hann Windowing to eliminate spectral leakage
    hann = 0.5 * (1.0 - np.cos((2.0 * np.pi * np.arange(size)) / (size - 1)))
    windowed = signal_chunk * hann

    # 2. Squared Difference Function d(tau)
    # Vectorized computation for high speed:
    # d(tau) = sum_{j=0}^{half_size-1} (x[j] - x[j+tau])^2
    w_head = windowed[:half_size]
    diff = np.zeros(max_period + 1, dtype=np.float64)

    for tau in range(min_period, max_period + 1):
        delta = w_head - windowed[tau:tau + half_size]
        diff[tau] = np.dot(delta, delta)

    # 3. Cumulative Mean Normalized Difference Function (CMNDF)
    cmndf = np.ones(max_period + 1, dtype=np.float64)
    running_sum = 0.0

    for tau in range(1, max_period + 1):
        running_sum += diff[tau]
        if tau >= min_period:
            cmndf[tau] = (diff[tau] * tau) / running_sum if running_sum > 0 else 1.0
        else:
            cmndf[tau] = 1.0

    # 4. Absolute Threshold (first dip below threshold)
    chosen_period = -1
    for tau in range(min_period, max_period + 1):
        if cmndf[tau] < threshold:
            # Walk forward to local valley trough
            while tau + 1 <= max_period and cmndf[tau + 1] < cmndf[tau]:
                tau += 1
            chosen_period = tau
            break

    # Fallback: find global minimum in search range if no dip below threshold
    if chosen_period == -1:
        search_range = cmndf[min_period:max_period + 1]
        min_idx = np.argmin(search_range)
        min_val = search_range[min_idx]
        if min_val <= 0.45:
            chosen_period = min_period + min_idx
        else:
            return 0.0  # Unvoiced / noise floor

    # 4b. Octave-Error Guard:
    # If the chosen dip is the 2nd harmonic (half period / +1 octave error),
    # check if the fundamental at roughly 2 * chosen_period has a comparable dip.
    # True fundamentals are usually at least comparably strong to their 2nd harmonic,
    # so if the candidate at 2 * chosen_period is nearly as deep, prefer the lower-frequency (larger period) candidate.
    double_period = int(round(chosen_period * 2))
    if double_period <= max_period:
        search_tol = max(2, int(0.10 * chosen_period))
        low_bound = max(min_period, double_period - search_tol)
        high_bound = min(max_period, double_period + search_tol)
        sub_range = cmndf[low_bound:high_bound + 1]
        best_offset = int(np.argmin(sub_range))
        best_double_tau = low_bound + best_offset
        best_double_val = sub_range[best_offset]

        # Prefer the fundamental if its dip is legitimately deep and nearly as strong as chosen dip
        if best_double_val < 0.20 and best_double_val <= cmndf[chosen_period] + 0.03:
            chosen_period = best_double_tau

    # 5. Parabolic Interpolation for continuous sub-sample precision
    refined_period = float(chosen_period)
    if min_period < chosen_period < max_period:
        s0 = cmndf[chosen_period - 1]
        s1 = cmndf[chosen_period]
        s2 = cmndf[chosen_period + 1]
        denom = 2.0 * (s0 - 2.0 * s1 + s2)
        if abs(denom) > 1e-6:
            delta = (s0 - s2) / denom
            if abs(delta) < 1.0:
                refined_period = chosen_period + delta

    if refined_period > 0:
        return float(sample_rate / refined_period)
    return 0.0


def compute_12_chroma(signal_chunk: np.ndarray, sample_rate: int = 22050) -> np.ndarray:
    """
    Computes 12-bin chromatic harmonic energy vector (C, C#, D, D#, E, F, F#, G, G#, A, A#, B).
    Folds FFT magnitude spectrum into semitone classes with L2 normalization.
    """
    size = len(signal_chunk)
    # Apply Hann window
    hann = 0.5 * (1.0 - np.cos((2.0 * np.pi * np.arange(size)) / (size - 1)))
    fft_spec = np.abs(np.fft.rfft(signal_chunk * hann))
    freqs = np.fft.rfftfreq(size, d=1.0 / sample_rate)

    chroma = np.zeros(12, dtype=np.float32)

    # Focus on piano fundamental and harmonic range: 27.5 Hz to 5000 Hz
    valid_mask = (freqs >= 27.5) & (freqs <= 5000.0)
    valid_freqs = freqs[valid_mask]
    valid_mags = fft_spec[valid_mask]

    if len(valid_freqs) > 0:
        # MIDI pitch number = 69 + 12 * log2(f / 440)
        midi_nums = 69.0 + 12.0 * np.log2(np.maximum(valid_freqs, 1e-5) / 440.0)
        semitone_bins = (np.round(midi_nums).astype(int) - 12) % 12

        for semitone in range(12):
            bin_mask = (semitone_bins == semitone)
            if np.any(bin_mask):
                chroma[semitone] = np.sum(valid_mags[bin_mask])

    # L2 normalize
    norm = np.linalg.norm(chroma)
    if norm > 1e-6:
        chroma = chroma / norm
    else:
        chroma = np.zeros(12, dtype=np.float32)

    return chroma


def compute_rms(signal_chunk: np.ndarray) -> float:
    """Calculates root-mean-square continuous energy (velocity proxy)."""
    if len(signal_chunk) == 0:
        return 0.0
    return float(np.sqrt(np.mean(signal_chunk ** 2)))


def extract_frame_features(signal_chunk: np.ndarray, sample_rate: int = 22050) -> np.ndarray:
    """
    Extracts the full 14-D continuous biological auditory perception vector:
    - [0]: log2(f0 / 440.0)
    - [1:13]: 12-bin harmonic chroma vector
    - [13]: RMS energy
    """
    f0 = yin_pitch_detect(signal_chunk, sample_rate)
    chroma = compute_12_chroma(signal_chunk, sample_rate)
    rms = compute_rms(signal_chunk)

    features = np.zeros(14, dtype=np.float32)

    if f0 > 0:
        # log2(f0 / 440.0) maps Middle C (261.6 Hz) to -0.75, A4 (440 Hz) to 0.0, A0 to -4.0, C8 to +3.25
        features[0] = float(np.clip(np.log2(f0 / 440.0), -4.0, 4.0))
    else:
        features[0] = 0.0

    features[1:13] = chroma
    features[13] = float(np.clip(rms * 4.0, 0.0, 1.0))  # Scale RMS into [0, 1] range

    return features


def load_audio(file_path: str, target_sr: int = 22050) -> tuple[np.ndarray, int]:
    """
    Loads audio from .mp3, .wav, or .ogg with fallback across librosa, soundfile, and scipy.
    """
    try:
        import librosa
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        return audio.astype(np.float32), sr
    except Exception as e1:
        try:
            import soundfile as sf
            audio, sr = sf.read(file_path)
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)
            return audio.astype(np.float32), sr
        except Exception as e2:
            raise RuntimeError(f"Could not load audio file '{file_path}': librosa ({e1}), soundfile ({e2})")
