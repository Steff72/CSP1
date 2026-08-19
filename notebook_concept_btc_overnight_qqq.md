# Notebook-Konzept: Bitcoin Overnight und QQQ-Eröffnungsgap

## 1. Projektidee

### Forschungsfrage

Wir untersuchen, ob Bitcoin-Aktivität ausserhalb der regulären
US-Handelszeit zusammen mit Sentiment- und Makroindikatoren zusätzliche
Information für die Richtung des nächsten QQQ-Eröffnungsgaps enthält.

Unsere zentrale Frage lautet:

> Verbessern Bitcoin-Overnight-Merkmale die Prognose, ob QQQ am nächsten
> Handelstag über oder unter dem Schluss der vorherigen regulären Sitzung
> eröffnet?

Wir untersuchen eine Prognosebeziehung. Aus den Ergebnissen leiten wir weder
Kausalität noch eine fertige Handelsstrategie ab.

### Einfacher Umfang

- QQQ ist das einzige vorhergesagte Asset.
- Eine Beobachtung entspricht einem QQQ-Handelstag.
- Die Richtung des Eröffnungsgaps ist die primäre Zielvariable.
- Der numerische Gap bleibt für EDA und Chronos-2 erhalten.
- Wir vergleichen eine naive Baseline, logistische Regression, XGBoost und
  Chronos-2.
- Das vollständige Projekt bleibt in einem Notebook.

## 2. Prognoseaufgabe

### Prognosezeitpunkt und Informationsfenster

Für jeden QQQ-Handelstag bestimmen wir mit dem Nasdaq-Kalender den Schluss der
vorherigen regulären Sitzung. Das Bitcoin-Fenster beginnt an diesem
Sitzungsschluss und endet um 09:00 Uhr New Yorker Zeit am Zieltag. Die Prognose
wird damit 30 Minuten vor der regulären Nasdaq-Eröffnung um 09:30 Uhr erstellt.

Bei stündlichen Bitcoin-Daten verwenden wir nur vollständig abgeschlossene
Kerzen. Die letzte verwendete Kerze reicht von 08:00 bis unmittelbar vor 09:00
Uhr. Alle Grenzen werden zuerst in `America/New_York` definiert und danach in
UTC gespeichert. Feiertage, Wochenenden, Zeitumstellungen und verkürzte
Sitzungen werden durch den Börsenkalender und zeitzonenbewusste Zeitstempel
behandelt.

QQQ kann im erweiterten Handel auch ausserhalb der regulären Sitzung gehandelt
werden. Unsere Formulierung bezieht sich deshalb bewusst auf Informationen
ausserhalb der regulären Handelszeit und nicht auf eine vollständig
geschlossene Börse.

### Numerischer Eröffnungsgap

Für den Zieltag \(t\) berechnen wir:

$$
y_t = r^{gap}_t
= \log\left(\frac{Open^{QQQ}_t}{Close^{QQQ}_{t-1}}\right).
$$

Für Tabellen und Grafiken stellen wir ihn auch in Prozent dar:

$$
Gap^{\%}_t = 100\left(\exp(y_t)-1\right).
$$

### Primäre Richtungsvariable

$$
Direction_t = \mathbb{1}(y_t > 0).
$$

`1` bedeutet eine höhere, `0` eine gleich hohe oder tiefere Eröffnung. Die
spätere Klassifikation wird direkt auf dieser Variable trainiert.

## 3. Datenquellen und Zeitraum

### Quellen

- Stundendaten `BTCUSDT` aus dem öffentlichen Binance-Archiv.
- QQQ-, VIX- und DXY-Tagesdaten über Yahoo Finance beziehungsweise `yfinance`.
- Fear & Greed Index über die API von Alternative.me.
- Nasdaq-Sitzungszeiten über `exchange_calendars` (`XNAS`).

Die Rohdaten werden lokal zwischengespeichert. Synthetische Trainingsdaten
werden nicht erzeugt.

### Zeitraum

- Gesamter Datenzeitraum: Februar 2018 bis zum festen Datenstichtag.
- Entwicklung und Walk-forward-Validierung: bis Ende 2025.
- Finaler partieller Holdout: 1. Januar bis zum festen Datenstichtag 1. Juli
  2026 (exklusiv).
- Validierungsjahre: 2021 bis 2025.

Der Holdout wird in EDA, Feature-Auswahl und Modellentwicklung nicht untersucht
und am Ende mit der eingefrorenen Methodik genau einmal ausgewertet.

## 4. Beobachtungseinheit und Merkmale

Eine Zeile entspricht dem Übergang von einer abgeschlossenen regulären
QQQ-Sitzung zur Eröffnung des nächsten QQQ-Handelstags.

### Identifikation und Ziel

- `previous_session_date`
- `target_session_date`
- `previous_close_utc`
- `forecast_cutoff_utc`
- `qqq_gap_log_return`
- `qqq_gap_percent`
- `qqq_gap_direction`

### Bitcoin-Overnight-Merkmale

Bitcoin-Rendite im Informationsfenster:

$$
r^{BTC}_{t}
= \log\left(\frac{P^{BTC}_{cutoff,t}}{P^{BTC}_{close,t-1}}\right).
$$

Volatilitätsintensität mit \(H_t\) Stundenrenditen:

$$
RV^{BTC}_{t}
= \sqrt{\frac{1}{H_t}\sum_{h=1}^{H_t}(r^{BTC}_{t,h})^2}.
$$

Weitere vorab definierte Merkmale:

- High-Low-Range,
- logarithmiertes durchschnittliches Volumen pro Stunde,
- maximaler Drawdown,
- Fensterlänge in Stunden.

Die Normierung von Volatilität und Volumen verhindert, dass lange
Wochenend- oder Feiertagsfenster automatisch grössere Intensitätswerte
erhalten.

### Kontrollmerkmale

Marktbasierte Kontrollvariablen werden spätestens am vorherigen regulären
Sitzungsschluss gemessen. Fear & Greed darf bis zum Prognose-Cutoff um 09:00
Uhr aktualisiert werden:

- letzter QQQ-Return,
- QQQ-Momentum über fünf Handelstage,
- QQQ-Volatilität über 20 Handelstage,
- vergangener QQQ-Eröffnungsgap und Mittel der letzten fünf Gaps,
- letzter Fear & Greed Index vor dem Prognose-Cutoff,
- letzter VIX-Schluss und Veränderung über fünf Handelstage,
- letzter DXY-Return und Veränderung über fünf Handelstage,
- Montag-Indikator für den Zieltermin,
- Dauer des Overnight-Fensters.

### Feature-Sets

**Kontrolle:** QQQ-Historie, Sentiment, VIX, DXY, Kalender und Fensterlänge.

**Mit Bitcoin:** dieselben Kontrollvariablen plus die Bitcoin-Merkmale.

Nur der direkte Vergleich dieser beiden Varianten misst den zusätzlichen
Informationsgehalt von Bitcoin innerhalb derselben Modellklasse.

## 5. Datenaufbereitung und Leakage-Schutz

- Features enthalten nur Informationen bis 09:00 Uhr am Zieltag.
- Der QQQ-Open des Zieltags erscheint ausschliesslich im Ziel.
- Marktfeatures werden auf der vorherigen abgeschlossenen Sitzung gemessen.
- Rolling Features und Gap-Lags sind strikt rückwärtsgerichtet.
- Fear & Greed wird per As-of-Merge mit dem letzten bekannten Zeitstempel
  zugeordnet.
- Unvollständige Bitcoin-Fenster werden entfernt und nicht interpoliert.
- Imputation, Skalierung und Modellanpassung erfolgen innerhalb des jeweiligen
  Trainingsfolds.
- Es gibt keinen zufälligen Train-Test-Split.

## 6. Explorative Datenanalyse

Die EDA verwendet ausschliesslich Daten vor 2026 und beantwortet:

1. Wie gross und wie stabil sind die täglichen QQQ-Eröffnungsgaps?
2. Wie ausgeglichen ist die Richtung insgesamt und nach Wochentag?
3. Wie stark variiert die Länge der Overnight-Fenster?
4. Besteht ein sichtbarer Zusammenhang zwischen BTC-Return und QQQ-Gap?
5. Unterscheidet sich der Zusammenhang an Montagen von Dienstag bis Freitag?
6. Wie verändert sich der Anteil positiver QQQ-Gaps über BTC-Return-Quintile?
7. Welche linearen Zusammenhänge bestehen zwischen Ziel, Bitcoin,
   Sentiment und Makro?

Korrelationen und Gruppenunterschiede sind deskriptiv. Entscheidend bleibt die
spätere Out-of-sample-Evaluation.

## 7. Zeitreihenvalidierung

Wir verwenden eine Expanding-window-Validierung:

```text
Vergangenheit bis 2020 -> Validierung 2021
Vergangenheit bis 2021 -> Validierung 2022
Vergangenheit bis 2022 -> Validierung 2023
Vergangenheit bis 2023 -> Validierung 2024
Vergangenheit bis 2024 -> Validierung 2025
Finaler Holdout         -> Januar bis Juni 2026
```

Jede Prognose nutzt nur Beobachtungen, deren Ziel zu diesem Zeitpunkt bereits
bekannt ist. Die Modellvarianten werden auf identischen Prognoseterminen
verglichen.

## 8. Modelle

### Naive Baseline

Die historische Mehrheitsklasse prognostiziert die bis dahin häufigere
Richtung. Sie ist die notwendige Referenz für Accuracy.

### Logistische Regression

Die logistische Regression liefert eine einfache, interpretierbare
statistische Klassifikation. Wir vergleichen eine Kontroll- und eine
Bitcoin-Variante.

### XGBoost Classifier

XGBoost bildet nichtlineare Beziehungen und Interaktionen ab. Wegen der
zeitlichen Abhängigkeit und der begrenzten Datenmenge verwenden wir feste,
konservative Parameter und keine nachträgliche Suche auf dem Holdout.

### Chronos-2

Chronos-2 prognostiziert den numerischen QQQ-Gap zero-shot. Wir vergleichen
drei Varianten: nur die historische Gap-Zeitreihe, dieselben Kontrollfeatures
wie bei XGBoost sowie Kontrollfeatures plus dieselben fünf Bitcoin-Merkmale.
Historische Feature-Werte werden als `past_covariates` und die am Cutoff des
Prognosetags bekannten Werte als `future_covariates` übergeben. Der unbekannte
QQQ-Gap des Zieltags erscheint nie in den Kovariaten. Der Median ist die
numerische Punktprognose; aus seinem Vorzeichen leiten wir die Richtung ab. Das
10-%- und 90-%-Quantil bilden
zusätzlich ein zentrales
80-%-Prognoseintervall. Damit messen wir den Bitcoin-Zusatznutzen auch innerhalb
des vortrainierten modernen Ansatzes, ohne ein neuronales Modell zu trainieren.

## 9. Evaluation

Primäre Metrik:

$$
Accuracy = \frac{1}{N}\sum_{t=1}^{N}
\mathbb{1}(Direction_t = \widehat{Direction}_t).
$$

Balanced Accuracy wird zusätzlich berichtet, damit ein leichter
Klassenunterschied sichtbar bleibt. Für Chronos-2 dokumentieren wir ausserdem
den MAE des numerischen Gaps. Die Haupttabelle zeigt:

- Ergebnisse insgesamt,
- Kontrollmodell gegen Bitcoin-Modell,
- Ergebnisse pro Validierungsjahr,
- eine separate Montagszeile als Analyse der längeren Wochenendfenster,
- eine Confusion Matrix für das vor dem Holdout festgelegte Hauptmodell.

## 10. Notebook-Stil und Technik

- Sprache: Deutsch in Wir-Form.
- Vor jedem Codeblock: Erklärung der Methode und bei Bedarf LaTeX-Formel.
- Nach jedem Ergebnisblock: konkrete Interpretation.
- Code-Kommentare: häufig und auf Englisch.
- Tabellen und Plots: klar beschriftet, Viridis-Palette.
- Apple Silicon: Chronos-2 verwendet MPS, falls verfügbar, sonst CPU.
- Keine versteckte Fachlogik in `helpers.py`.
- Lightning wird nur verwendet, falls später ein trainiertes neuronales Modell
  einen klaren Nutzen davon hat; für Zero-shot-Chronos ist es nicht nötig.

## 11. Quellen

- Binance Public Data: https://data.binance.vision/
- yfinance: https://ranaroussi.github.io/yfinance/
- Alternative.me Fear & Greed API: https://alternative.me/crypto/fear-and-greed-index/
- exchange_calendars: https://github.com/gerrymanoim/exchange_calendars
- Forecasting: Principles and Practice: https://otexts.com/fpp3/
- Marco Peixeiro, Statistical Forecasting Baseline:
  https://github.com/marcopeix/youtube_tutorials/blob/main/YT_03_forecasting_stats.ipynb
- XGBoost: https://doi.org/10.1145/2939672.2939785
- Chronos-2: https://arxiv.org/abs/2510.15821
- MachineLearningMastery, 2026 Time Series Toolkit:
  https://machinelearningmastery.com/the-2026-time-series-toolkit-5-foundation-models-for-autonomous-forecasting/
