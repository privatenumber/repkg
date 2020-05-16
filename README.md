# 🚚 REPKG [![GitHub stars](https://img.shields.io/github/stars/privatenumber/repkg.svg?style=social&label=Star&maxAge=2592000)](https://github.com/privatenumber/repkg)


[REPKG](https://repkg.now.sh) is a service that bundles npm packages to AMD on-demand. Powered by [UNPKG](https://unpkg.com).

<span style="font-family:apple color emoji">⚠️</span> _This service is for development purposes only and **should not** be used in production._

## 👩‍💻 Usage
Replace `UNPKG.com` with `REPKG.now.sh` to AMDify it!

- **Bare specifier**: [unpkg.com/pretty-ms](https://unpkg.com/pretty-ms) → [**repkg.now.sh/pretty-ms**](https://repkg.now.sh/pretty-ms) ✨
- **Specific version**: [unpkg.com/urijs@1.19.2](https://unpkg.com/urijs@1.19.2) → [**repkg.now.sh/urijs@1.19.2**](https://repkg.now.sh/urijs@1.19.2) ✨
- **Deep import path**: [axios@0.19.2/.../buildFullPath](https://unpkg.com/axios@0.19.2/lib/core/buildFullPath) → [**axios@0.19.2/.../buildFullPath**](https://repkg.now.sh/axios@0.19.2/lib/core/buildFullPath) ✨
- (_Bonus_) **Minification (`?min`)**: [**mem@6.1.0?min**](https://repkg.now.sh/mem@6.1.0?min) ✨

#### Request will redirect to UNPKG if...
  - the request hits UNPKG's `/browse/` page
  - the asset is a source-map (`.map`)
  - the asset is already AMD

## 💫 Inspirations
- [packd](https://github.com/Rich-Harris/packd)
- [jspm.io](https://jspm.io)
- [Pika CDN](https://www.pika.dev/cdn)

---

Built and maintained by [@privatenumber](https://github.com/privatenumber) [![GitHub followers](https://img.shields.io/github/followers/privatenumber.svg?style=social&label=Follow)](https://github.com/privatenumber?tab=followers) and powered by [Vercel](https://vercel.com) ❤️
