import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import time, re, random, math

def parse_contacts(text):
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    contacts = []
    for line in lines:
        parts = re.split(r"[\s,:]+", line)
        if len(parts) >= 3:
            contacts.append((int(parts[0]) - 1, int(parts[1]) - 1, float(parts[2])))
    return contacts

def calc_energy(pos, seq, JHH, JPB, WP, contacts):
    n = len(seq)
    chh = 0
    neighbor_counts = [0] * n
    for i in range(n):
        for j in range(i + 1, n):
            dx = abs(pos[i][0] - pos[j][0])
            dy = abs(pos[i][1] - pos[j][1])
            if dx + dy == 1 and abs(i - j) > 1:
                if seq[i] == 'H' and seq[j] == 'H':
                    chh += 1
                if seq[i] == 'P':
                    neighbor_counts[i] += 1
                if seq[j] == 'P':
                    neighbor_counts[j] += 1
    p_bury = sum(1 for i in range(n) if seq[i] == 'P' and neighbor_counts[i] >= 3)
    pull = 0
    p_sum = 0
    for i, j, p in contacts:
        p_sum += p
        d = abs(pos[i][0] - pos[j][0]) + abs(pos[i][1] - pos[j][1])
        if d == 1:
            pull += p
    energy = -JHH * chh + JPB * p_bury - WP * pull
    agreement = pull / p_sum if p_sum > 0 else 0
    cx = np.mean([x for x, _ in pos])
    cy = np.mean([y for _, y in pos])
    rg = (sum((x - cx) ** 2 + (y - cy) ** 2 for x, y in pos) / n) ** 0.5
    return energy, chh, p_bury, agreement, rg

def mc_step(seq, temp, positions, JHH, JPB, WP, contacts):
    n = len(seq)
    pivot = random.randrange(n)
    px, py = positions[pivot]
    rotations = [(0, 1, -1, 0), (0, -1, 1, 0), (-1, 0, 0, -1)]
    r = random.choice(rotations)
    new_pos = [p[:] for p in positions]
    for i in range(pivot + 1, n):
        dx = positions[i][0] - px
        dy = positions[i][1] - py
        nx = px + r[0] * dx + r[1] * dy
        ny = py + r[2] * dx + r[3] * dy
        new_pos[i] = [nx, ny]
    if len({(x, y) for x, y in new_pos}) < n:
        return positions
    oldE = calc_energy(positions, seq, JHH, JPB, WP, contacts)[0]
    newE = calc_energy(new_pos, seq, JHH, JPB, WP, contacts)[0]
    dE = newE - oldE
    if dE <= 0 or random.random() < math.exp(-dE / temp):
        return new_pos
    return positions

def init_state(seq, contacts_text):
    positions = [[i, 0] for i in range(len(seq))]
    contacts = parse_contacts(contacts_text)
    return positions, contacts

st.set_page_config(page_title="HP 접힘 시뮬레이터")

seq = st.text_input("서열", st.session_state.get("seq", "HPPHPPHPHPPH"))
JHH = st.number_input("J_HH", value=float(st.session_state.get("JHH", 1.0)), step=0.1)
JPB = st.number_input("J_P,bury", value=float(st.session_state.get("JPB", 1.0)), step=0.1)
WP = st.number_input("w_pull", value=float(st.session_state.get("WP", 2.0)), step=0.1)
temp = st.number_input("T", value=float(st.session_state.get("temp", 1.0)), step=0.1)
contacts_text = st.text_area("예측 접촉 (i j p 한 줄씩)", st.session_state.get("contacts_text", "1 10 0.9\n3 8 0.5"))

if st.button("초기화") or "positions" not in st.session_state:
    st.session_state.seq = seq
    st.session_state.JHH = JHH
    st.session_state.JPB = JPB
    st.session_state.WP = WP
    st.session_state.temp = temp
    st.session_state.contacts_text = contacts_text
    st.session_state.positions, st.session_state.contacts = init_state(seq, contacts_text)
    st.session_state.running = False

col1, col2 = st.columns(2)
if col1.button("시작"):
    st.session_state.running = True
if col2.button("정지"):
    st.session_state.running = False

positions = st.session_state.get("positions")
contacts = st.session_state.get("contacts", [])

if st.session_state.get("running"):
    for _ in range(10):
        positions = mc_step(seq, temp, positions, JHH, JPB, WP, contacts)
    st.session_state.positions = positions
    time.sleep(0.05)
    st.experimental_rerun()

energy, chh, p_bury, agreement, rg = calc_energy(positions, seq, JHH, JPB, WP, contacts)
st.markdown(f"E={energy:.2f} | H-H={chh} | P bury={p_bury} | Agreement={agreement*100:.1f}% | Rg={rg:.2f}")

fig, ax = plt.subplots()
arr = np.array(positions)
ax.plot(arr[:,0], arr[:,1], color='gray')
for i, (x, y) in enumerate(arr):
    color = '#e74c3c' if seq[i] == 'H' else '#3498db'
    ax.scatter(x, y, color=color, s=100, edgecolors='black', zorder=3)
ax.set_aspect('equal')
ax.axis('off')
st.pyplot(fig)
