# What is this project?
This is a website for showing the TTK (Time To Kill) for all operators' guns in Rainbow Six Siege. This is a great way to be able to tell how good mathematically certain guns are.

The code for this website uses **React.js**.

## This is how values are calculated...

**Extended Barrel effect**: Damage * 1.12 (Rounded down)

**DPS**: Damage per second, calculated as (Damage * Fire Rate) / 60

**Bullets to Kill 1 Armo**r: 100 / Damage (Rounded up)

**Bullets to Kill 2 Armor**: 110 / Damage (Rounded up)

**Bullets to Kill 3 Armor**: 125 / Damage (Rounded up)

**TTK 1 Armor**: (Bullets to Kill 1 Armor - 1) / (Fire Rate / 60)

**TTK 2 Armor**: (Bullets to Kill 2 Armor - 1) / (Fire Rate / 60)

**TTK 3 Armor**: (Bullets to Kill 3 Armor - 1) / (Fire Rate / 60)

**Note**: This assumes every bullet is shot to the enemy's chest (not arms or legs, as shooting here would lower the damage) AND that the bullet is shot within 25 m (damage dropoff happens at any farther distance)