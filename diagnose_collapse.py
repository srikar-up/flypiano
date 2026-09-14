"""
Diagnose Model Collapse & Core Saturation
=========================================
Checks whether the trained ConnectomeMultiHeadAdapter outputs actually change
across three very different test notes (low: A1/C2, mid: A4/C4, high: C7/C8).

Also checks for saturation in the frozen biological connectome core:
- Compares auditory_nerve_input features before the core vs brain_signals after the core.
"""

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
import torch
import numpy as np
from main import ConnectomeMultiHeadAdapter, AdvancedChromaticLogicModule
import pitch_features
import build_dataset

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def run_diagnostic():
    print("=" * 80)
    print("🔍 RUNNING MODEL COLLAPSE & CORE SATURATION DIAGNOSTIC")
    print(f"Device: {DEVICE}")
    print("=" * 80)

    model_path = "fly_piano_multihead_adapter.pt"
    if not os.path.exists(model_path):
        print(f"❌ Model file '{model_path}' not found!")
        return

    model = ConnectomeMultiHeadAdapter(sensory_dim=14, feedback_dim=64).to(DEVICE)
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.eval()
    print(f"✅ Loaded model weights from {model_path}")

    compiler = AdvancedChromaticLogicModule(num_keys=88, ticks_per_beat=4)

    test_notes = [
        {"name": "Low Note (C2 / MIDI 36)", "midi": 36, "vel": 0.85},
        {"name": "Mid Note (A4 / MIDI 69)", "midi": 69, "vel": 0.70},
        {"name": "High Note (C7 / MIDI 96)", "midi": 96, "vel": 0.90},
    ]

    # Test 1: Ideal Synthetic Feature Vectors (direct mathematical representation)
    print("\n" + "-" * 80)
    print("TEST 1: Direct 14-D Sensory Feature Inputs")
    print("-" * 80)

    sensory_vectors = []
    labels = []
    for tn in test_notes:
        p, o, v, _ = compiler.midi_to_components(tn["midi"], int(tn["vel"] * 127))
        f0 = 440.0 * (2.0 ** ((tn["midi"] - 69) / 12.0))
        vec = np.zeros(14, dtype=np.float32)
        vec[0] = float(np.clip(np.log2(f0 / 440.0), -4.0, 4.0))
        chroma = np.zeros(12, dtype=np.float32)
        chroma[p] = 1.0
        chroma[(p + 7) % 12] += 0.35
        chroma[(p + 4) % 12] += 0.20
        norm = np.linalg.norm(chroma)
        if norm > 1e-6:
            chroma /= norm
        vec[1:13] = chroma
        vec[13] = v
        sensory_vectors.append(vec)
        labels.append((tn["name"], tn["midi"], p, o, v))

    eval_vectors(model, compiler, sensory_vectors, labels, desc="Direct Synthetic 14-D Vectors")

    # Test 2: Features extracted from synthesized acoustic piano audio chunks
    print("\n" + "-" * 80)
    print("TEST 2: Features Extracted via YIN + Chroma Pipeline from Audio Waveforms")
    print("-" * 80)

    audio_vectors = []
    for tn in test_notes:
        chunk = build_dataset.synthesize_acoustic_note(tn["midi"], duration_sec=0.5, velocity=tn["vel"])
        feat = pitch_features.extract_frame_features(chunk)
        audio_vectors.append(feat)

    eval_vectors(model, compiler, audio_vectors, labels, desc="Waveform Extracted 14-D Features")


def eval_vectors(model, compiler, vectors, labels, desc=""):
    print(f"\n--- {desc} ---")
    x = torch.tensor(np.array(vectors), dtype=torch.float32, device=DEVICE)
    leg_fb = torch.zeros((len(vectors), 64), dtype=torch.float32, device=DEVICE)

    with torch.no_grad():
        # Input-side features before frozen core
        sensory_feat = model.auditory_nerve_input(x)
        feedback_feat = model.proprioceptive_adapter(leg_fb)
        integrated = sensory_feat + feedback_feat

        # Brain signals after frozen biological core
        brain_signals = model.biological_connectome_core(integrated)

        p_logits = model.pitch_head(brain_signals)
        o_logits = model.octave_head(brain_signals)
        force = model.force_head(brain_signals).squeeze(-1)

        pred_p = torch.argmax(p_logits, dim=1).cpu().numpy()
        pred_o = torch.argmax(o_logits, dim=1).cpu().numpy()
        pred_f = force.cpu().numpy()

    for i, (name, midi, true_p, true_o, true_v) in enumerate(labels):
        fp = pred_p[i]
        fo = pred_o[i]
        ff = pred_f[i]
        fk = compiler.components_to_key(fp, fo)
        p_name = compiler.CHROMATIC_NAMES[fp] if fp < 12 else "REST"
        k_name = compiler.get_note_name(fk) if fp < 12 else "REST"

        print(f"\n🎵 {name}:")
        print(f"   Target:    Pitch={true_p} ({compiler.CHROMATIC_NAMES[true_p]}), Octave={true_o}, Vel={true_v:.2f}")
        print(f"   Predicted: Pitch={fp} ({p_name}), Octave={fo}, Force={ff:.3f} -> Key: {k_name} (idx {fk})")
        print(f"   Raw 14-D Input [0 (log2f0), 13 (RMS)]: f0_cue={vectors[i][0]:.3f}, rms={vectors[i][13]:.3f}")
        print(f"   Top-3 Pitch Logits:  {torch.topk(p_logits[i], 3).indices.cpu().numpy().tolist()} (vals: {[round(v, 2) for v in torch.topk(p_logits[i], 3).values.cpu().numpy().tolist()]})")
        print(f"   Top-3 Octave Logits: {torch.topk(o_logits[i], 3).indices.cpu().numpy().tolist()} (vals: {[round(v, 2) for v in torch.topk(o_logits[i], 3).values.cpu().numpy().tolist()]})")

    # Check variation across the three test notes
    print("\n📊 Cross-Note Output Variance Analysis:")
    p_unique = len(set(pred_p))
    o_unique = len(set(pred_o))
    f_range = np.ptp(pred_f)
    print(f"   Unique Pitch Classes: {p_unique}/3: {pred_p.tolist()}")
    print(f"   Unique Octaves:       {o_unique}/3: {pred_o.tolist()}")
    print(f"   Force Range (max-min): {f_range:.4f} (values: {[round(float(v), 3) for v in pred_f]})")

    if p_unique == 1 and o_unique == 1:
        print("   ⚠️ COLLAPSE DETECTED: Model predicted the EXACT SAME pitch & octave for all 3 notes!")
    else:
        print("   ✅ OUTPUTS DIFFER: Model outputs respond differently to different notes!")

    # Check saturation in frozen core: input vs output cosine similarities
    print("\n🔬 Frozen Core Saturation Check:")
    s_feats = sensory_feat.cpu().numpy()
    b_sigs = brain_signals.cpu().numpy()

    for pair in [(0, 1), (1, 2), (0, 2)]:
        i, j = pair
        # Cosine distance for sensory_feat (before core)
        cos_in = np.dot(s_feats[i], s_feats[j]) / (np.linalg.norm(s_feats[i]) * np.linalg.norm(s_feats[j]) + 1e-8)
        # Cosine distance for brain_signals (after core)
        cos_out = np.dot(b_sigs[i], b_sigs[j]) / (np.linalg.norm(b_sigs[i]) * np.linalg.norm(b_sigs[j]) + 1e-8)
        l2_in = np.linalg.norm(s_feats[i] - s_feats[j])
        l2_out = np.linalg.norm(b_sigs[i] - b_sigs[j])
        print(f"   Pair {labels[i][0][:3]} vs {labels[j][0][:3]}:")
        print(f"     Before Core (sensory_feat): CosSim = {cos_in:.4f}, L2 Diff = {l2_in:.4f}")
        print(f"     After Core  (brain_signal): CosSim = {cos_out:.4f}, L2 Diff = {l2_out:.4f}")

    # Inspect activation distribution of brain_signals
    b_mean = np.mean(b_sigs)
    b_std = np.std(b_sigs)
    b_zeros = np.mean(b_sigs == 0.0) * 100.0
    print(f"   Brain Signals Mean: {b_mean:.4f}, Std: {b_std:.4f}, Dead/Zero Neurons: {b_zeros:.1f}%")

if __name__ == "__main__":
    run_diagnostic()
