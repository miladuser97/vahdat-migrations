# config/

This folder is reserved for application-level configuration objects (for
example, site metadata used in multiple places, or feature flags), as
distinct from tool configuration files that live in the project root
(like tsconfig.json or tailwind.config.ts).

## Subfolders

- `theme/` — future design-related settings (e.g. color palette values,
  the list of supported light/dark modes) that the Theme Provider will
  read from later.
- `navigation/` — future site menu/navigation structure (e.g. the list of
  main menu links), kept in one place so menus stay consistent across the
  site.
- `site/` — future general site information (e.g. site name, default SEO
  description, contact details) used in multiple places.

No configuration values have been implemented in any subfolder yet — only
the structure is prepared, so future settings have one obvious, agreed
location instead of being invented ad hoc.
