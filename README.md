# CSP1: Bitcoin Weekend Signals for QQQ Opening Gaps

Wir untersuchen, ob Bitcoin-Bewegungen während des Wochenendes zusammen mit
Sentiment- und Makroindikatoren den Eröffnungsgap von QQQ am folgenden Montag
prognostizieren können. Verglichen werden einfache Baselines, SARIMAX, XGBoost
und Chronos-2.

Das aktualisierte methodische Konzept ist in
`notebook_concept_btc_weekend_qqq.md` dokumentiert. Das neue zentrale Notebook
`notebooks/btc_weekend_qqq_forecasting.ipynb` enthält bereits Setup,
Datenbezug, Leakage-sichere Ziel- und Feature-Konstruktion, die erste EDA sowie
Expanding-window-Backtesting mit zwei einfachen Baselines, SARIMAX und XGBoost.
Das bestehende Volatilitäts-Notebook bleibt als bisheriger Projektstand
unverändert erhalten.

Für das zentrale Notebook ist insgesamt vorgesehen:

1. reproduzierbares Setup mit Apple-Silicon-/MPS-Erkennung,
2. stündliche Bitcoin-Daten sowie QQQ-, Fear-&-Greed-, VIX- und DXY-Daten,
3. zeitliche Ausrichtung auf das Wochenende ohne Look-ahead Leakage,
4. Konstruktion des QQQ-Eröffnungsgaps,
5. kompakte Bitcoin-, Sentiment- und Makrofeatures,
6. explorative Datenanalyse ohne den finalen Holdout,
7. Expanding-window Walk-forward-Validierung,
8. einfache Baselines und SARIMAX,
9. XGBoost mit und ohne Bitcoin-Wochenendfeatures,
10. Chronos-2 als Zero-Shot-Foundation-Model-Methode,
11. einen gemeinsamen Vergleich mit MAE und Richtungsgenauigkeit.

## Projektstruktur

```text
.
├── notebooks/
│   ├── btc_weekend_qqq_forecasting.ipynb
│   └── bitcoin_volatility_forecasting.ipynb  # bisheriger Projektstand
├── notebook_concept_btc_weekend_qqq.md
├── requirements.txt
└── README.md
```

Nach der Umstellung bleiben alle Projektabschnitte in einem Notebook. Die
Kerndefinitionen und Berechnungen sind dort direkt sichtbar.
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
nicht versioniert. Daten ab 2025 bleiben bis zur finalen Modellevaluation als
Holdout unberührt.

Chronos-2 wird beim ersten Einsatz von Hugging Face geladen und danach im
lokalen Modell-Cache wiederverwendet. Die Inferenz nutzt auf Apple Silicon MPS,
wenn die installierte PyTorch-Version dies unterstützt, sonst automatisch CPU.

## Datenquellen

- [Öffentliches Binance-Archiv](https://data.binance.vision/)
  für stündliche Bitcoin-OHLCV-Daten
- [Yahoo Finance über yfinance](https://ranaroussi.github.io/yfinance/)
  für QQQ, VIX und DXY
- [Alternative.me Fear & Greed API](https://alternative.me/crypto/fear-and-greed-index/)

Die Daten werden ausschliesslich für Ausbildung und Forschung verwendet. Für
Yahoo-Finance-Daten gelten die jeweiligen Nutzungsbedingungen.
