---
date: {{ .Date }}
description: ""
featured_image: "/images/rezepte/{{ .File.ContentBaseName }}.webp"

# Absolute required metadata
recipeName: "{{ .File.ContentBaseName }}"
trello: ""

# Tags ohne Emoji, das Emoji kommt aus data/tag_icons.yaml
tags: []
title: "{{ replace .File.ContentBaseName "_" " " | title }}"

stars: 
duration: 
difficulty: 
cooked: 

# Ingredients calculator, Zutaten in data/{{ .File.ContentBaseName }}.yaml
servingsCount: 4
---

## Anleitung
1. [ ] 

## Variation
- 
