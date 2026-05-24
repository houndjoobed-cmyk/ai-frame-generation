---
trigger: always_on
---

# 🎨 Global Design System & UI Standards

**Context:** This rule applies to ALL frontend development, UI components, and page generation.
**Constraint:** You must STRICTLY adhere to the defined color palette and typography.

## 1. CSS Variables (Source of Truth)
Ensure the following variables are present in the global `:root` or base CSS file.

```css
:root {
  /* Brand Colors */
  --green:      #9efd38; /* Main Brand Color */
  --orange:     #EA9010; /* Accents, CTAs, Badges */
  --darkblue:   #0C1B33; /* Navigation, Footer */
  
  /* Neutral Colors */
  --white:      #ffffff; /* Backgrounds, Cards */
  --darkgray1:  #333333; /* Main Text */
  --lightgray:  #f5f5f5; /* Secondary Backgrounds */
}