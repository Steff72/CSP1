# CSP1: Bitcoin Realized Volatility Forecasting

Wir untersuchen, ob sich die zukünftige realisierte Bitcoin-Volatilität mit
einfachen Baselines, GARCH, XGBoost und Chronos-2 prognostizieren lässt. Als
externe Signale verwenden wir den Fear & Greed Index, VIX, DXY und Nasdaq.

Der aktuelle Stand enthält im zentralen Notebook:

1. reproduzierbares Setup mit Apple-Silicon-/MPS-Erkennung,
2. Download und lokales Caching der Zeitreihen,
3. zeitliche Ausrichtung ohne Look-ahead Leakage,
4. Konstruktion der 1- und 7-Tage-Zielvariablen,
5. Feature Engineering,
6. explorative Datenanalyse ohne den finalen Holdout,
7. purged Walk-forward-Validierung,
8. naive Baselines und GARCH(1,1),
9. XGBoost mit vier Feature-Sets,
10. einen gemeinsamen Vergleich mit MAE, RMSE und QLIKE.

## Projektstruktur

```text
.
├── notebooks/
│   └── bitcoin_volatility_forecasting.ipynb
├── notebook_concept_bitcoin_volatility.md
├── requirements.txt
└── README.md
```

Alle Projektabschnitte bleiben in diesem einen Notebook. Die Kerndefinitionen
und Berechnungen sind dort direkt sichtbar.
Eine `helpers.py` wird erst ergänzt, wenn eine kleine technische Hilfsfunktion
tatsächlich mehrfach benötigt wird.

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
