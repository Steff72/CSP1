# CSP1: Bitcoin Realized Volatility Forecasting

Wir untersuchen, ob sich die zukünftige realisierte Bitcoin-Volatilität mit
einfachen Baselines, GARCH, XGBoost und Chronos-2 prognostizieren lässt. Als
externe Signale verwenden wir den Fear & Greed Index, VIX, DXY und Nasdaq.

Der aktuelle Stand enthält den ersten Notebook-Teil:

1. reproduzierbares Setup mit Apple-Silicon-/MPS-Erkennung,
2. Download und lokales Caching der Zeitreihen,
3. zeitliche Ausrichtung ohne Look-ahead Leakage,
4. Konstruktion der 1- und 7-Tage-Zielvariablen,
5. Feature Engineering,
6. explorative Datenanalyse ohne den finalen Holdout,
7. geprüfte Übergabe an purged Walk-forward-Folds.

## Projektstruktur

```text
.
├── notebooks/
│   └── 01_data_preparation_and_eda.ipynb
├── notebook_concept_bitcoin_volatility.md
├── requirements.txt
└── README.md
```

Die Kerndefinitionen und Berechnungen bleiben direkt im Notebook sichtbar.
Eine `helpers.py` wird erst ergänzt, wenn eine kleine technische Hilfsfunktion
tatsächlich mehrfach benötigt wird.

## Lokales Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
jupyter lab
```

Beim ersten Durchlauf lädt das Notebook Daten aus dem Internet. Danach werden
die Rohdaten lokal unter `data/raw/` zwischengespeichert. Dieser Ordner wird
nicht versioniert. Das Notebook verwendet einen festen exklusiven UTC-Stichtag
und lädt nur vollständig abgeschlossene Bitcoin-Tageskerzen. Daten ab 2025
bleiben bis zur finalen Modellevaluation als Holdout unberührt.

## Datenquellen

- [Yahoo Finance über yfinance](https://ranaroussi.github.io/yfinance/)
  für BTC-USD, VIX, DXY und Nasdaq
- [Alternative.me Fear & Greed API](https://alternative.me/crypto/fear-and-greed-index/)

Die Daten werden ausschliesslich für Ausbildung und Forschung verwendet. Für
Yahoo-Finance-Daten gelten die jeweiligen Nutzungsbedingungen.
