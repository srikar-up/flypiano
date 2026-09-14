"""
One-Click Training & Generalization Pipeline for Continuous Auditory Fly Connectome
==================================================================================
Runs:
1. build_dataset.py: Generates real audio training dataset & held-out unseen Bach dataset.
2. Trains ConnectomeMultiHeadAdapter on 14-D continuous noisy audio features.
3. Evaluates on held-out unseen piece (Bach Cello Suite Prelude).
4. Exports:
   - fly_piano_multihead_adapter.pt (PyTorch state dict)
   - fly_connectome_weights.json (Browser client-side neural inference weights)
   - concert_data.json (Generalization accuracy report)
"""

import os
import sys
import json
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

import pitch_features
import build_dataset
from main import ConnectomeMultiHeadAdapter, AdvancedChromaticLogicModule, UnifiedFlyGymSimulation, export_connectome_weights_to_json

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def train_and_export_all():
    print("=" * 80)
    print("🚀 FLYPIANO CONTINUOUS AUDITORY NEURAL TRAINING & BROWSER EXPORT PIPELINE")
    print("=" * 80)
    print(f"Device: {DEVICE}")

    # 1. Build Datasets
    build_dataset.build_all_datasets(".")

    train_file = "dataset_train.pt"
    val_file = "dataset_val.pt"

    train_ds = torch.load(train_file, map_location=DEVICE)
    val_ds = torch.load(val_file, map_location=DEVICE)

    x_train = train_ds["inputs"].to(DEVICE)
    p_train = train_ds["pitch_labels"].to(DEVICE)
    o_train = train_ds["octave_labels"].to(DEVICE)
    f_train = train_ds["velocity_labels"].to(DEVICE)

    x_val = val_ds["inputs"].to(DEVICE)
    p_val = val_ds["pitch_labels"].to(DEVICE)
    o_val = val_ds["octave_labels"].to(DEVICE)
    f_val = val_ds["velocity_labels"].to(DEVICE)
    val_ticks = val_ds.get("ticks", [])

    num_samples = len(x_train)
    NUM_FLIES = 16

    # 2. Instantiate Model
    model = ConnectomeMultiHeadAdapter(sensory_dim=14, feedback_dim=64).to(DEVICE)
    sim = UnifiedFlyGymSimulation(num_flies=NUM_FLIES, feedback_dim=64, device=DEVICE)
    compiler = AdvancedChromaticLogicModule(num_keys=88, ticks_per_beat=4)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = optim.Adam(trainable_params, lr=0.007, weight_decay=1e-5)
    crit_pitch = nn.CrossEntropyLoss()
    crit_octave = nn.CrossEntropyLoss()
    crit_force = nn.L1Loss()

    print("\n" + "-" * 80)
    print(f"🧠 Training Connectome Adapter on {num_samples} Noisy Continuous Audio Samples...")
    print("-" * 80)

    start_t = time.time()
    num_epochs = 40
    batch_size = 32

    for epoch in range(1, num_epochs + 1):
        model.train()
        sim.reset()
        epoch_loss = 0.0
        pitch_hits = 0
        octave_hits = 0
        total_items = 0

        # Shuffle training set
        indices = torch.randperm(num_samples, device=DEVICE)

        for b_start in range(0, num_samples, batch_size):
            b_idx = indices[b_start:b_start + batch_size]
            b_x = x_train[b_idx]
            b_p = p_train[b_idx]
            b_o = o_train[b_idx]
            b_f = f_train[b_idx]
            cur_bs = len(b_idx)

            # Parallel leg feedback simulation
            leg_feedback = torch.randn((cur_bs, 64), device=DEVICE) * 0.05
            p_logits, o_logits, force = model(b_x, leg_feedback)

            loss_p = crit_pitch(p_logits, b_p)
            loss_o = crit_octave(o_logits, b_o)

            # P1 Fix: Mask velocity loss to active (non-rest) notes only to prevent collapse to zero
            active_mask = (b_p != 12)
            if active_mask.any():
                loss_f = crit_force(force[active_mask].view(-1), b_f[active_mask].view(-1))
            else:
                loss_f = torch.tensor(0.0, device=DEVICE)

            loss = loss_p + 0.6 * loss_o + 0.8 * loss_f

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            pred_p = torch.argmax(p_logits, dim=1)
            pred_o = torch.argmax(o_logits, dim=1)

            epoch_loss += loss.item() * cur_bs
            pitch_hits += (pred_p == b_p).sum().item()
            octave_hits += (pred_o == b_o).sum().item()
            total_items += cur_bs

        p_acc = (pitch_hits / total_items) * 100.0
        o_acc = (octave_hits / total_items) * 100.0
        comp = (p_acc + o_acc) / 2.0

        if epoch % 5 == 0 or epoch == num_epochs:
            avg_loss = epoch_loss / total_items
            print(f"   Epoch {epoch:02d}/{num_epochs:02d} | Loss: {avg_loss:.4f} | "
                  f"Pitch Acc: {p_acc:5.1f}% | Octave Acc: {o_acc:5.1f}% | Composite: {comp:5.1f}%")

    print(f"⏱️ Training complete in {time.time() - start_t:.2f}s")

    # 3. Save PyTorch Model
    pt_path = "fly_piano_multihead_adapter.pt"
    torch.save(model.state_dict(), pt_path)
    print(f"💾 Saved PyTorch weights to: {pt_path}")

    # 4. Export JSON Weights for Browser
    json_path = "fly_connectome_weights.json"
    export_connectome_weights_to_json(model, json_path)

    # 5. Held-Out Generalization Evaluation (J.S. Bach Prelude)
    print("\n" + "-" * 80)
    print("🎻 Evaluating Held-Out Generalization on Unseen J.S. Bach Cello Suite No. 1...")
    print("-" * 80)

    model.eval()
    val_items = len(x_val)
    val_p_hits = 0
    val_o_hits = 0
    val_k_hits = 0
    val_force_err = 0.0
    active_val_items = 0
    active_force_err = 0.0
    records = []

    with torch.no_grad():
        leg_fb = torch.zeros((val_items, 64), device=DEVICE)
        p_logits, o_logits, force = model(x_val, leg_fb)

        pred_p = torch.argmax(p_logits, dim=1)
        pred_o = torch.argmax(o_logits, dim=1)

        for i in range(val_items):
            fp = pred_p[i].item()
            fo = pred_o[i].item()
            ff = force[i].item()

            tp = p_val[i].item()
            to = o_val[i].item()
            tf = f_val[i].item()

            fk = compiler.components_to_key(fp, fo)
            tk = compiler.components_to_key(tp, to)

            p_match = (fp == tp)
            o_match = (fo == to) or (tp == 12 and fp == 12)
            k_match = (fk == tk) or (tp == 12 and fp == 12)
            f_err = abs(ff - tf)

            if p_match: val_p_hits += 1
            if o_match: val_o_hits += 1
            if k_match: val_k_hits += 1
            val_force_err += f_err

            if tp != 12:
                active_val_items += 1
                active_force_err += f_err

            t_name = compiler.get_note_name(tk) if tp != 12 else "⏸ REST"
            f_name = compiler.get_note_name(fk) if fp != 12 else "⏸ REST"

            records.append({
                "tick": i + 1,
                "target_pitch": tp,
                "target_octave": to,
                "target_vel": round(tf, 3),
                "target_name": t_name,
                "target_key": tk,
                "fly_pitch": fp,
                "fly_octave": fo,
                "fly_force": round(ff, 3),
                "fly_name": f_name,
                "fly_key": fk,
                "is_rest": (tp == 12),
                "match": k_match
            })

    p_acc_val = (val_p_hits / val_items) * 100.0
    o_acc_val = (val_o_hits / val_items) * 100.0
    k_acc_val = (val_k_hits / val_items) * 100.0
    f_mae_val = val_force_err / val_items
    act_f_mae = (active_force_err / active_val_items) if active_val_items > 0 else f_mae_val
    comp_val = (k_acc_val * 0.5) + (p_acc_val * 0.2) + (o_acc_val * 0.15) + ((1.0 - min(1.0, act_f_mae)) * 100.0 * 0.15)

    print(f"📊 Held-Out Generalization Results (Unseen Audio):")
    print(f"   • Pitch & Rest Accuracy:      {val_p_hits}/{val_items} ({p_acc_val:.1f}%)")
    print(f"   • Octave Range Accuracy:      {val_o_hits}/{val_items} ({o_acc_val:.1f}%)")
    print(f"   • Exact 88-Key Match Rate:    {val_k_hits}/{val_items} ({k_acc_val:.1f}%)")
    print(f"   • Active Strike Velocity MAE: {act_f_mae:.3f} (Overall MAE: {f_mae_val:.3f})")
    print(f"   • Composite Generalization:   {comp_val:.2f}%")
    print("=" * 80)

    # Save concert_data.json
    concert_payload = {
        "mode": "continuous_auditory_88_keys",
        "num_keys": 88,
        "song": "J.S. Bach - Cello Suite No. 1 Prelude (Held-Out Unseen)",
        "bpm": 100,
        "ticks_per_beat": 4,
        "total_ticks": val_items,
        "pitch_accuracy": round(p_acc_val, 2),
        "octave_accuracy": round(o_acc_val, 2),
        "key_accuracy": round(k_acc_val, 2),
        "velocity_mae": round(f_mae_val, 4),
        "composite_score": round(comp_val, 2),
        "ticks": records
    }
    with open("concert_data.json", "w", encoding="utf-8") as f:
        json.dump(concert_payload, f, indent=2)
    print("📄 Exported Held-Out Generalization Report to: concert_data.json")

if __name__ == "__main__":
    train_and_export_all()
