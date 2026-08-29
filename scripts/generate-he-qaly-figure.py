"""
Drummond Fig 5.2: QALYs gained, areas A and B separated at Death 1.
White background, primary #9333ea. Labels sit outside fills.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import FancyBboxPatch
import numpy as np

OUT = Path(__file__).resolve().parents[1] / "reading-illustrations" / "he_30_4_qaly_area.png"

WHITE = "#FFFFFF"
PRIMARY = "#9333ea"
SOFT = "#F3E8FF"
A_FILL = "#D8B4FE"
B_FILL = "#A78BFA"
INK = "#1F2937"
MUTED = "#6B7280"

DEATH1 = 5.6
DEATH2 = 7.6
T_MAX = 8.5


def q_from_segments(t, segments):
    q = np.zeros_like(t)
    for t0, t1, val in segments:
        q[(t >= t0) & (t < t1)] = val
    return q


def badge(ax, x, y, letter):
    ax.text(
        x,
        y,
        letter,
        ha="center",
        va="center",
        fontsize=20,
        fontweight="bold",
        color=PRIMARY,
        zorder=9,
        bbox={
            "boxstyle": "circle,pad=0.35",
            "facecolor": WHITE,
            "edgecolor": PRIMARY,
            "linewidth": 2.2,
        },
    )


def main():
    without_seg = [
        (0.0, 2.0, 0.90),
        (2.0, 3.15, 0.56),
        (3.15, 3.85, 0.30),
        (3.85, 4.95, 0.46),
        (4.95, DEATH1, 0.16),
        (DEATH1, T_MAX, 0.0),
    ]
    with_seg = [
        (0.0, 2.55, 0.90),
        (2.55, 4.35, 0.78),
        (4.35, DEATH2, 0.62),
        (DEATH2, T_MAX, 0.0),
    ]

    t = np.linspace(0, T_MAX, 1400)
    q_wo = q_from_segments(t, without_seg)
    q_w = q_from_segments(t, with_seg)
    a_mask = t < DEATH1
    b_mask = (t >= DEATH1) & (t < DEATH2)

    fig = plt.figure(figsize=(14.0, 11.0), dpi=100, facecolor=WHITE)
    ax = fig.add_axes([0.13, 0.22, 0.82, 0.58])
    ax.set_facecolor(WHITE)

    ax.fill_between(t, 0, q_wo, where=(t < DEATH1), color=SOFT, linewidth=0, zorder=1)
    ax.fill_between(
        t,
        q_wo,
        q_w,
        where=a_mask & (q_w >= q_wo),
        color=A_FILL,
        linewidth=0,
        zorder=2,
    )
    ax.fill_between(t, 0, q_w, where=b_mask, color=B_FILL, linewidth=0, zorder=2)

    ax.plot(t, q_wo, color=MUTED, lw=2.6, solid_capstyle="butt", zorder=3)
    ax.plot(t, q_w, color=PRIMARY, lw=3.2, solid_capstyle="butt", zorder=4)
    ax.axvline(DEATH1, color=PRIMARY, ls=(0, (6, 5)), lw=2.0, zorder=5)

    ax.set_xlim(-0.05, T_MAX)
    ax.set_ylim(0.0, 1.12)
    ax.set_xticks([0.0, DEATH1, DEATH2])
    ax.set_xticklabels(["Intervention", "Death 1", "Death 2"], fontsize=13, color=INK)
    ax.set_yticks([0.0, 1.0])
    ax.set_yticklabels(["0  Dead", "1.0  Perfect health"], fontsize=13, color=INK)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(INK)
    ax.spines["bottom"].set_color(INK)
    ax.spines["left"].set_linewidth(1.5)
    ax.spines["bottom"].set_linewidth(1.5)
    ax.tick_params(length=4, pad=8, colors=INK)
    ax.set_xlabel("")
    ax.set_ylabel("Health-related quality of life (weights)", fontsize=14, color=INK, labelpad=10)

    box = FancyBboxPatch(
        (0.28, 0.42),
        1.95,
        0.20,
        boxstyle="round,pad=0.03,rounding_size=0.03",
        facecolor=WHITE,
        edgecolor=MUTED,
        linewidth=1.2,
        zorder=7,
    )
    ax.add_patch(box)
    ax.text(1.25, 0.52, "1. Without programme", ha="center", va="center", fontsize=12, color=INK, zorder=8)
    ax.annotate(
        "",
        xy=(1.15, 0.90),
        xytext=(1.25, 0.62),
        arrowprops={"arrowstyle": "-|>", "color": MUTED, "lw": 1.5},
        zorder=8,
    )

    ax.annotate(
        "2. With programme",
        xy=(3.55, 0.78),
        xytext=(4.55, 1.04),
        ha="center",
        fontsize=13,
        color=PRIMARY,
        fontweight="bold",
        arrowprops={"arrowstyle": "-|>", "color": PRIMARY, "lw": 1.5},
        zorder=8,
    )

    badge(ax, 3.35, 0.67, "A")
    badge(ax, 6.55, 0.31, "B")

    fig.text(
        0.13,
        0.92,
        "QALYs gained from an intervention",
        fontsize=22,
        fontweight="bold",
        color=INK,
        ha="left",
        va="center",
    )
    fig.text(
        0.13,
        0.875,
        "Quality (A) plus quantity (B), separated at Death 1",
        fontsize=14,
        color=MUTED,
        ha="left",
        va="center",
    )
    fig.add_artist(
        plt.Line2D(
            [0.13, 0.26],
            [0.845, 0.845],
            transform=fig.transFigure,
            color=PRIMARY,
            linewidth=4,
            solid_capstyle="butt",
        )
    )

    legend_items = [
        Line2D([0], [0], color=SOFT, lw=12, label="Without programme"),
        Line2D([0], [0], color=A_FILL, lw=12, label="A  quality gain"),
        Line2D([0], [0], color=B_FILL, lw=12, label="B  extra years"),
    ]
    fig.text(0.54, 0.195, "Duration (years)", ha="center", va="center", fontsize=15, color=INK)
    fig.legend(
        handles=legend_items,
        loc="upper left",
        bbox_to_anchor=(0.13, 0.16),
        frameon=False,
        fontsize=13,
        ncol=3,
        labelcolor=INK,
        handlelength=1.6,
        columnspacing=1.8,
    )
    fig.text(
        0.13,
        0.055,
        "QALYs gained = A + B.  A is quality improvement during years the person would have lived anyway.\nB is extra years of life, quality-adjusted. The dashed line at Death 1 separates A from B.",
        fontsize=13,
        color=MUTED,
        ha="left",
        va="center",
    )

    fig.savefig(OUT, dpi=100, facecolor=WHITE)
    plt.close(fig)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
