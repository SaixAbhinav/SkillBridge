SYNONYMS = {
    "reactjs": "react",
    "react.js": "react",
    "js": "javascript",
    "node": "node.js",
    "nodejs": "node.js",
    "ui/ux": "ui design",
    "ux": "ui design",
    "ux design": "ui design",
    "py": "python",
    "ml": "machine learning",
    "social media": "social media marketing",
    "instagram marketing": "social media marketing",
    "whatsapp": "whatsapp api",
    "whatsapp business api": "whatsapp api",
    "powerbi": "power bi",
    "ms excel": "excel",
    "copywriting": "content writing",
    "graphic design": "logo design",
}


def normalize_skill(skill: str) -> str:
    key = skill.strip().lower()
    return SYNONYMS.get(key, key)
