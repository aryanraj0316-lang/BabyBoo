"""Part shape definitions for the BabyBoo mascot rig.

All coordinates are in the source image frame (1254 x 1254 px,
assets/mascot/buddy_source.png). Shapes describe each part's FULL extent,
including the portion hidden behind parts in front of it, so that hidden
fur can be reconstructed for when parts move.
"""

import numpy as np

SOURCE_SIZE = 1254

# Head: an ellipse fitted to the visible silhouette (top, sides, ear seams),
# cut by the detected chin contour (the render's head has a flatter bottom).
HEAD_ELLIPSE = ((655.33, 576.92), (630.50, 693.46), 107.15)  # cv2 RotatedRect

# Chin contour (x, y) detected from the shadow line under the head.
CHIN_POINTS = [
    (330, 640), (352, 676), (370, 700), (388, 722), (406, 741), (424, 759),
    (442, 773), (460, 785), (478, 793), (496, 801), (514, 806), (532, 812),
    (550, 818), (568, 821), (586, 825), (604, 829), (622, 831), (640, 834),
    (658, 835), (676, 836), (694, 837), (712, 838), (730, 838), (748, 837),
    (766, 836), (784, 834), (802, 832), (830, 838), (870, 850),
]

EAR_L = ((410.06, 316.87), 140.58)  # circle fitted to the outer ear arc
EAR_R = ((929.85, 347.83), 136.24)

# Waving arm (raised forearm + paw). The right/top edge between (362, 690)
# and (545, 815) runs under the chin and is hidden in the source.
ARM_WAVE = [
    (240, 540), (285, 545), (302, 557), (312, 577), (321, 592), (334, 595),
    (346, 602), (353, 617), (357, 632), (358, 650), (356, 668), (358, 690),
    (366, 694), (392, 698), (440, 718), (500, 746), (552, 780), (566, 826),
    (520, 848), (472, 866), (425, 886), (392, 904), (375, 912),
    (330, 900), (280, 870), (225, 820), (175, 765), (140, 705), (122, 650),
    (128, 600), (160, 562), (200, 543),
]
# Region of the arm drawn IN FRONT of the head (the paw overlaps the head's
# left edge down to where the head's lower-left edge takes over, ~y 668).
ARM_WAVE_FRONT = [
    (100, 500), (420, 500), (420, 650), (358, 668), (330, 700), (100, 700),
]

ARM_REST = [
    (760, 840), (840, 846), (880, 880), (905, 930), (912, 990), (900, 1045),
    (865, 1078), (815, 1092), (770, 1086), (735, 1066), (710, 1030),
    (702, 990), (708, 945), (725, 905), (742, 870),
]

LEG_L = ((442.0, 1068.0), (124.0, 118.0), -8.0)  # center, (rx, ry), deg
LEG_R = ((951.0, 1073.0), (122.0, 114.0), 6.0)

TORSO = [
    (428, 858), (470, 806), (540, 770), (650, 762), (740, 772),
    (800, 800), (850, 836), (900, 878), (925, 950), (918, 1060), (890, 1150),
    (820, 1190), (650, 1200), (480, 1192), (380, 1160), (335, 1080),
    (340, 980), (372, 922), (400, 892),
]

# Face features ---------------------------------------------------------
EYE_L_HINT = (500, 545)
EYE_R_HINT = (820, 590)
MOUTH_BOX = (555, 600, 745, 740)  # x0, y0, x1, y1 search window
CHEEK_L = ((418, 640), 92)
CHEEK_R = ((880, 690), 92)
FACE_BASE = ((655, 610), (285, 200), 50)  # center, radii, feather

# Pivots (source coords) and limits -------------------------------------
PIVOTS = {
    'head': (650, 815),
    'ear_l': (452, 372),
    'ear_r': (892, 398),
    'arm_wave': (452, 862),
    'arm_rest': (815, 880),
    'torso': (650, 1185),  # seat contact point, squash pivot
    'leg_l': (442, 1150),
    'leg_r': (951, 1150),
    'eyes': (660, 568),
    'cheeks': (650, 665),
    'mouth': (650, 668),
    'face_base': (655, 610),
}
MAX_ROT = {
    'head': 8, 'ear_l': 10, 'ear_r': 10, 'arm_wave': 26, 'arm_rest': 3,
    'torso': 3, 'leg_l': 0, 'leg_r': 0, 'eyes': 0, 'cheeks': 0, 'mouth': 0,
    'face_base': 0,
}
# Back to front.
Z_ORDER = ['ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r',
           'arm_wave', 'head', 'arm_wave_front']


def catmull_rom_closed(points, samples_per_seg=12):
    p = np.asarray(points, dtype=np.float64)
    n = len(p)
    out = []
    for i in range(n):
        p0, p1, p2, p3 = p[(i - 1) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]
        for s in range(samples_per_seg):
            t = s / samples_per_seg
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t +
                              (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                              (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    return np.array(out)


def chin_y(x):
    xs = np.array([c[0] for c in CHIN_POINTS], float)
    ys = np.array([c[1] for c in CHIN_POINTS], float)
    x = np.asarray(x, float)
    y = np.interp(x, xs, ys)
    y = np.where(x < xs[0], ys[0] - (xs[0] - x) * 1.6, y)
    y = np.where(x > xs[-1], ys[-1] + (x - xs[-1]) * 0.3, y)
    return y
