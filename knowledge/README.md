# Knowledge folders

One folder per agent (`knowledge/<agent-name>/`) plus `knowledge/shared/`. Each agent **reads its own folder and `shared/` before every answer** and treats those files as its most specific source, ahead of the general research in `docs/`.

Drop documents into the folder of the expert who owns that topic. Each folder's README lists what belongs there. Personalities and model choices are in [`docs/agent-brains.md`](../docs/agent-brains.md).

| Agent | Persona | Folder |
|---|---|---|
| `orchestrator` | Marisol | [`orchestrator/`](orchestrator/) |
| `agent-builder` | Theo | [`agent-builder/`](agent-builder/) |
| `engagement-lead` | Victoria | [`engagement-lead/`](engagement-lead/) |
| `market-research-analyst` | Priya | [`market-research-analyst/`](market-research-analyst/) |
| `competitive-intelligence-analyst` | Diego | [`competitive-intelligence-analyst/`](competitive-intelligence-analyst/) |
| `hispanic-market-cultural-advisor` | Lourdes | [`hispanic-market-cultural-advisor/`](hispanic-market-cultural-advisor/) |
| `head-of-coffee` | Mateo | [`head-of-coffee/`](head-of-coffee/) |
| `food-pastry-advisor` | Camille | [`food-pastry-advisor/`](food-pastry-advisor/) |
| `site-selection-advisor` | Rafael | [`site-selection-advisor/`](site-selection-advisor/) |
| `cafe-designer-architect` | Ines | [`cafe-designer-architect/`](cafe-designer-architect/) |
| `buildout-project-manager` | Frank | [`buildout-project-manager/`](buildout-project-manager/) |
| `permitting-zoning-expediter` | Gloria | [`permitting-zoning-expediter/`](permitting-zoning-expediter/) |
| `coffee-equipment-specialist` | Kenji | [`coffee-equipment-specialist/`](coffee-equipment-specialist/) |
| `restaurant-tech-specialist` | Aisha | [`restaurant-tech-specialist/`](restaurant-tech-specialist/) |
| `data-analytics-analyst` | Sam | [`data-analytics-analyst/`](data-analytics-analyst/) |
| `cafe-operations-manager` | Rosa | [`cafe-operations-manager/`](cafe-operations-manager/) |
| `coffee-sourcing-specialist` | Andrés | [`coffee-sourcing-specialist/`](coffee-sourcing-specialist/) |
| `food-safety-specialist` | Nadia | [`food-safety-specialist/`](food-safety-specialist/) |
| `hr-talent-advisor` | Jasmine | [`hr-talent-advisor/`](hr-talent-advisor/) |
| `financial-modeler` | Ethan | [`financial-modeler/`](financial-modeler/) |
| `funding-capital-advisor` | Grace | [`funding-capital-advisor/`](funding-capital-advisor/) |
| `accountant-tax-advisor` | Harold | [`accountant-tax-advisor/`](accountant-tax-advisor/) |
| `corporate-attorney` | Daniela | [`corporate-attorney/`](corporate-attorney/) |
| `lease-attorney` | Marcus | [`lease-attorney/`](lease-attorney/) |
| `insurance-risk-advisor` | Olivia | [`insurance-risk-advisor/`](insurance-risk-advisor/) |
| `brand-strategist` | Julian | [`brand-strategist/`](brand-strategist/) |
| `digital-social-marketer` | Bianca | [`digital-social-marketer/`](digital-social-marketer/) |
| `pr-partnerships-manager` | Leo | [`pr-partnerships-manager/`](pr-partnerships-manager/) |
| `b2b-sales-lead` | Carmen | [`b2b-sales-lead/`](b2b-sales-lead/) |
| (all) | — | [`shared/`](shared/) |
