# CSP1: Bitcoin Overnight Signals for QQQ Opening Gaps

Wir untersuchen, ob Bitcoin-Aktivität ausserhalb der regulären US-Handelszeit
zusammen mit Sentiment- und Makroindikatoren die Richtung des nächsten
QQQ-Eröffnungsgaps prognostizieren kann.

Eine Beobachtung entspricht einem QQQ-Handelstag. Das Bitcoin-Fenster beginnt
mit dem Ende der vorherigen regulären Nasdaq-Sitzung und endet um 09:00 Uhr
New Yorker Zeit, 30 Minuten vor der nächsten regulären Eröffnung. Das
numerische Gap wird als logarithmische Rendite vom vorherigen QQQ-Schluss bis
zum nächsten QQQ-Open berechnet; die primäre Zielvariable ist sein Vorzeichen.

Das zentrale Notebook `notebooks/btc_overnight_qqq_forecasting.ipynb` enthält
Setup,
reproduzierbare Datenbeschaffung, zeitliche Ausrichtung, Leakage-Prüfungen und
explorative Datenanalyse sowie die Expanding-window-Folds 2021-2025 und die
historische Mehrheitsbaseline. Die logistische Regression ist als täglicher
Walk-forward-Vergleich ohne und mit Bitcoin umgesetzt. XGBoost ergänzt denselben
Vergleich mit festen, konservativen Parametern für nichtlineare Beziehungen.
Chronos-2 ist zero-shot als univariate Referenz sowie mit denselben Kontroll-
und Bitcoin-Features wie XGBoost umgesetzt. Die Richtung wird direkt aus dem
Vorzeichen der numerischen Medianprognose abgeleitet. Der partielle Holdout vom
2. Januar bis 31. August 2026 wird im letzten Abschnitt mit der vorab
festgelegten Methodik ausgewertet.

Auf den 166 Handelstagen des Holdouts erreicht XGBoost mit Bitcoin-Features
73,5 % Accuracy und 74,0 % Balanced Accuracy. Die XGBoost-Kontrollvariante ohne
Bitcoin erreicht 51,2 % Accuracy und 54,2 % Balanced Accuracy. Diese
Prognoseergebnisse belegen weder Kausalität noch die Profitabilität einer
Handelsstrategie.

Umgesetzt sind:

1. eine historische Mehrheitsklasse als naive Baseline,
2. logistische Regression als einfache statistische Methode,
3. XGBoost als klassisches nichtlineares Machine-Learning-Modell,
4. Chronos-2 als vortrainiertes Time-Series Foundation Model,
5. Expanding-window-Validierung 2021-2025 und ein finaler partieller Holdout
   vom 2. Januar bis 31. August 2026,
6. ein direkter Vergleich der Feature-Sets ohne und mit Bitcoin.

## Projektstruktur

```text
.
├── notebooks/
│   └── btc_overnight_qqq_forecasting.ipynb
├── output/
│   └── pdf/
│       └── btc_overnight_qqq_forecasting.pdf
├── notebooklm/
│   ├── Predicting_QQQ_Gaps_via_Bitcoin.pdf
│   └── Predicting_QQQ_Gaps_via_Bitcoin.pptx
├── Time_Series_Challenge_Proposal_Balz_Binkert_simplified.docx
├── requirements.txt
└── README.md
```

Alle inhaltlichen Schritte bleiben im Notebook nachvollziehbar. Es gibt keine
`helpers.py`; die gesamte Fachlogik ist direkt im Notebook sichtbar.
Die Unterlagen im Ordner `notebooklm/` dienen der zusammenfassenden Darstellung;
für Methodik, Berechnungen und Resultate ist das ausgeführte Notebook massgebend.

## Lokales Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
# XGBoost benötigt auf macOS die OpenMP-Laufzeit
brew install libomp
python -m pip install -r requirements.txt
jupyter lab
```

Beim ersten Durchlauf lädt das Notebook die Daten und legt lokale Caches unter
`data/raw/` an. Diese Dateien werden nicht versioniert. Daten ab 2026 werden
erst im letzten Notebook-Abschnitt als partieller Holdout ausgewertet.

Chronos-2 wird beim ersten Einsatz von Hugging Face geladen und danach im
lokalen Modell-Cache wiederverwendet. Die Inferenz nutzt auf Apple Silicon MPS,
wenn die installierte PyTorch-Version dies unterstützt, sonst CPU.

## Datenquellen

- [Binance Public Data](https://data.binance.vision/) für stündliche
  `BTCUSDT`-OHLCV-Daten
- [Yahoo Finance über yfinance](https://ranaroussi.github.io/yfinance/) für
  QQQ, VIX und DXY
- [Alternative.me Fear & Greed API](https://alternative.me/crypto/fear-and-greed-index/)
- [exchange_calendars](https://github.com/gerrymanoim/exchange_calendars) für
  reguläre Nasdaq-Sitzungen, Feiertage und verkürzte Handelstage

Die Daten werden ausschliesslich für Ausbildung und Forschung verwendet. Für
die externen Marktdaten gelten die jeweiligen Nutzungsbedingungen.

## Blog

Der Beitrag [Bitcoin als Frühindikator für den QQQ Eröffnungsgap](docs/BLOG.md)
erzählt die Ansätze, Ergebnisse und Erfahrungen des Projekts. Die gestaltete
Blogseite liegt in [docs/index.html](docs/index.html) und ist für eine
Veröffentlichung über GitHub Pages vorbereitet. Die Charts stammen unverändert
aus den gespeicherten Notebook-Ausgaben; zwei Illustrationen wurden aus den
Slides übernommen. Hinweise zur Veröffentlichung stehen in [docs/README.md](docs/README.md).
