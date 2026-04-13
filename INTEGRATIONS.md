# INTEGRATIONS.md — Fastwell

## Overview

All integrations are opt-in. Users connect in Settings → Integrations. Disconnecting is always available. Manual entries always take precedence over synced data for the same day and metric.

---

## Apple HealthKit (iOS) — V1.1

### Setup
1. Tap "Connect Apple Health" in Settings → Integrations
2. iOS permission prompt — user approves specific permissions
3. Sync begins immediately on app open

### Data Pulled

| HealthKit Type | Fastwell Metric | Frequency |
|---|---|---|
| StepCount | steps | On app open |
| SleepAnalysis | sleep_hours | On app open |
| BodyMass | weight | On app open |
| HeartRate | heart_rate_resting | On app open |
| DietaryWater | water_ml | On app open |
| WorkoutType | exercise_type, exercise_minutes | On app open |

All synced entries tagged `source: 'apple_health'`. Manual entry wins conflicts.

### Implementation
```javascript
import AppleHealthKit from 'react-native-health';
const permissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.Water,
      AppleHealthKit.Constants.Permissions.Workout,
    ],
  },
};
```

---

## Garmin Connect API — V1.1

Free to use. Register at developer.garmin.com. **App approval takes 1–4 weeks — submit this application immediately, before building.**

### Setup
1. Tap "Connect Garmin" in Settings → Integrations
2. In-app browser opens Garmin OAuth login
3. User authenticates → token stored encrypted in Supabase Vault
4. Background sync every 6 hours

### Data Pulled

| Garmin Data | Fastwell Metric | Notes |
|---|---|---|
| Daily Steps | steps | More accurate than phone-only |
| Sleep Stages | sleep_hours, sleep_quality | Light/deep/REM breakdown |
| Stress Score | health_entries | 0–100 daily score |
| Body Battery | health_entries | Garmin energy metric 0–100 |
| Workouts | exercise_type, exercise_minutes | |
| Resting Heart Rate | heart_rate_resting | |
| HRV | hrv | Key recovery metric for this demographic |

All synced entries tagged `source: 'garmin'`.

---

## Future Integrations (V2+)

### Oura Ring
Popular in NZ, growing fast. Exceptional sleep and HRV. Public API — check pricing at cloud.ouraring.com. OAuth 2.0 pattern, similar to Garmin.

### Fitbit / Google Fit
Useful for Android users. Both APIs are free. Steps, sleep, heart rate.

### Smart Rings
RingConn and others gaining traction in NZ. Monitor APIs quarterly — integrate when stable.

### Withings Smart Scales
Auto-syncs weight and body composition. Good fit for members with connected scales.

---

## Integration Status Display (Settings)

```
Apple Health     Connected · Last sync: Today 8:42am     [Disconnect]
Garmin Connect   Connected · Last sync: Today 6:00am     [Disconnect]
Oura Ring        Coming soon
Fitbit           Coming soon
```
