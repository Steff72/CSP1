# Notebook-Konzept: Bitcoin-Wochenende und QQQ-Eröffnungsgap

## 1. Projektidee

### Forschungsfrage

Wir untersuchen, ob Bitcoin-Bewegungen während des Wochenendes zusammen mit
Sentiment- und Makroindikatoren zusätzliche Information für den
Eröffnungsgap von QQQ am folgenden Montag enthalten.

Unsere zentrale Frage lautet:

> Können wir den QQQ-Eröffnungsgap am Montag mit Informationen prognostizieren,
> die bis Sonntagabend verfügbar sind, und verbessern Bitcoin-Wochenenddaten
> die Prognose gegenüber Modellen ohne diese Daten?

Wir untersuchen ausdrücklich eine Prognosebeziehung. Aus den Ergebnissen leiten
wir keine Kausalität und keine fertige Handelsstrategie ab.

### Bewusst einfacher Umfang

- QQQ ist das einzige vorhergesagte Asset.
- Wir prognostizieren ausschliesslich den QQQ-Eröffnungsgap.
- QQQ-Volumen ist kein Ziel und wird nicht analysiert.
- Wir vergleichen zwei einfache Baselines, SARIMAX, XGBoost und Chronos-2.
- Wir verwenden MAE und Richtungsgenauigkeit als Hauptmetriken.
- Das vollständige Projekt bleibt in einem Notebook.

Damit decken wir die Anforderungen der Time Series Challenge ab, ohne die
Analyse durch zusätzliche Assets, Zielvariablen oder Metriken zu überladen.

## 2. Prognoseaufgabe

### Prognosezeitpunkt

Der Informationsstand endet am Sonntag um 23:59 Uhr in der Zeitzone
`America/New_York`. Alle Zeitstempel werden technisch in UTC gespeichert, aber
für die Bildung des Wochenendfensters in New Yorker Zeit interpretiert.
Bei stündlichen Bitcoin-Daten ist die letzte vollständig abgeschlossene Kerze
zu diesem Zeitpunkt die Kerze mit Schlusszeit Sonntag 23:00 Uhr. Wir verwenden
keine teilweise laufende Stundenkerze.

Wir verwenden nur reguläre Wochenenden, auf die ein Handelstag am Montag folgt.
Wochenenden vor einem Feiertagsmontag werden ausgeschlossen. So besitzen alle
Beobachtungen dieselbe zeitliche Definition.

### Numerische Zielvariable

Wir prognostizieren die logarithmische Rendite zwischen dem QQQ-Schlusskurs am
Freitag und dem QQQ-Eröffnungskurs am Montag:

$$
y_t = r^{\mathrm{gap}}_t
= \log\left(\frac{Open^{QQQ}_{Monday,t}}
{Close^{QQQ}_{Friday,t}}\right).
$$

Für Tabellen und Grafiken können wir den Gap zusätzlich in Prozent darstellen:

$$
Gap^{\%}_t = 100\left(\exp(y_t)-1\right).
$$

### Abgeleitete Richtung

Aus jeder numerischen Prognose leiten wir ab, ob QQQ höher oder tiefer öffnet:

$$
Direction_t = \mathbb{1}(y_t > 0),
\qquad
\widehat{Direction}_t = \mathbb{1}(\hat y_t > 0).
$$

Damit lösen alle Modelle dieselbe Regressionsaufgabe. Die Richtung ist eine
leicht verständliche zweite Sicht auf dieselbe Prognose und keine separate
Klassifikationspipeline.

## 3. Datenquellen und Zeitraum

### Datenquellen

- Stündliche Bitcoin-OHLCV-Daten aus dem öffentlichen Binance-Archiv
  (`BTCUSDT`) für die präzise Abgrenzung des Wochenendes.
- QQQ-Tagesdaten über Yahoo Finance beziehungsweise `yfinance`.
- Fear & Greed Index über die API von Alternative.me.
- VIX und DXY über Yahoo Finance beziehungsweise `yfinance`.

Die stündlichen Bitcoin-Daten werden nach dem Download lokal zwischengespeichert.
Das Notebook erzeugt daraus selbst die benötigten Wochenendmerkmale. Es werden
keine synthetischen Trainingsdaten generiert.

### Untersuchungszeitraum

- Entwicklung und Walk-forward-Validierung: 2018 bis Ende 2024.
- Finaler Holdout: 2025 bis zum festen Datenstichtag.
- Der Datenstichtag wird im Setup als feste Konstante definiert.

Der Holdout bleibt während EDA, Feature-Auswahl und Modellentwicklung
unangetastet und wird erst im finalen Abschnitt ausgewertet.

## 4. Beobachtungseinheit und Datensatz

Eine Zeile entspricht einem regulären Wochenende und dem unmittelbar folgenden
QQQ-Handelsmontag.

### Identifikationsspalten

- `friday_date`
- `sunday_cutoff`
- `monday_date`

### Zielspalten

- `qqq_gap_log_return`
- `qqq_gap_percent`
- `qqq_gap_direction`

### Bitcoin-Wochenendmerkmale

Das Bitcoin-Wochenende beginnt mit dem QQQ-Börsenschluss am Freitag um
16:00 Uhr New Yorker Zeit und endet am Sonntag um 23:59 Uhr.

Wochenendrendite:

$$
r^{BTC}_{weekend,t}
= \log\left(\frac{P^{BTC}_{Sunday\ cutoff,t}}
{P^{BTC}_{Friday\ 16:00,t}}\right).
$$

Realisierte Volatilität aus stündlichen Renditen:

$$
RV^{BTC}_{weekend,t}
= \sqrt{\sum_{h=1}^{H_t}\left(r^{BTC}_{t,h}\right)^2}.
$$

Zusätzlich verwenden wir:

- Wochenend-High-Low-Range,
- logarithmiertes Bitcoin-Wochenendvolumen,
- maximale negative Bewegung innerhalb des Wochenendes,
- getrennte Samstag- und Sonntagsrendite, sofern diese ohne unnötige
  Komplexität stabil berechnet werden können.

Wir halten diese Liste klein. Zusätzliche technische Indikatoren werden nur
ergänzt, wenn die EDA einen klaren Grund dafür zeigt.

### Sentiment- und Makromerkmale

Am Prognosezeitpunkt verwenden wir nur bereits bekannte Werte:

- letzter verfügbarer Fear & Greed Index,
- VIX-Schlusswert vom Freitag und dessen Veränderung zur Vorwoche,
- DXY-Rendite vom Freitag und Veränderung über fünf Handelstage,
- QQQ-Freitagsrendite,
- QQQ-Momentum der letzten fünf Handelstage,
- QQQ-Volatilität der letzten 20 Handelstage,
- vergangene QQQ-Eröffnungsgaps als Lags.

VIX-, DXY- oder QQQ-Werte vom Montag sind nicht erlaubt. Wenn der genaue
Publikationszeitpunkt eines Sentimentwerts unklar ist, verwenden wir den letzten
nachweislich vor dem Sonntag-Cutoff verfügbaren Wert.

## 5. Datenaufbereitung und Leakage-Schutz

Wir führen die Datenaufbereitung vollständig chronologisch durch.

### Zentrale Regeln

- Features einer Beobachtung dürfen nur Informationen bis Sonntag 23:59 Uhr
  New Yorker Zeit enthalten.
- Der QQQ-Eröffnungskurs vom Montag kommt ausschliesslich in der Zielvariable vor.
- Rolling Features und Lags werden nur rückwärtsgerichtet berechnet.
- Imputation, Skalierung und Feature-Auswahl werden innerhalb des jeweiligen
  Trainingsfolds angepasst.
- Wir verwenden keinen zufälligen Train-/Test-Split.
- Wir prüfen Zeitstempel, Zeitzonen, Duplikate, fehlende Werte und OHLC-Regeln.
- Wir verwenden für QQQ konsistent split- und ausschüttungsbereinigte OHLC-Daten.

### Plausibilitätsprüfungen

Das Notebook zeigt kompakte Kontrolltabellen für:

- Datenquelle, Zeitraum und Anzahl Beobachtungen,
- ausgeschlossene Feiertagswochenenden,
- fehlende Werte vor und nach der Bereinigung,
- einige manuell nachvollziehbare Freitag-Sonntag-Montag-Beispiele,
- Klassenanteil positiver und negativer QQQ-Gaps.

## 6. Explorative Datenanalyse

Die EDA verwendet ausschliesslich den Entwicklungszeitraum bis Ende 2024.
Jede Grafik beantwortet eine konkrete Frage.

### Vorgesehene Analysen

1. QQQ-Eröffnungsgap im Zeitverlauf: Gibt es Ausreisser oder Regimewechsel?
2. Verteilung der QQQ-Gaps: Wie gross und symmetrisch sind die Bewegungen?
3. Positive und negative Gaps: Ist die Richtungsverteilung ausgeglichen?
4. BTC-Wochenendrendite gegen QQQ-Gap: Ist ein sichtbarer Zusammenhang vorhanden?
5. Positive und negative BTC-Wochenenden getrennt: Ist der Zusammenhang asymmetrisch?
6. Korrelationsübersicht: Wie hängen Ziel, BTC-, Sentiment- und Makromerkmale zusammen?
7. Zeitliche Darstellung ausgewählter Einflussgrössen: Treten Beziehungen nur in
   einzelnen Marktphasen auf?

Wir behandeln Korrelationen als deskriptive Hinweise, nicht als Beweis für
Vorhersagekraft. Entscheidend bleibt die spätere Out-of-Sample-Evaluation.

## 7. Feature-Vergleich

Wir verwenden nur zwei klar definierte Feature-Sets:

### Kontrollmodell ohne Bitcoin-Wochenende

- vergangene QQQ-Gaps,
- QQQ-Freitagsrendite, Momentum und Volatilität,
- Fear & Greed,
- VIX,
- DXY.

### Vollständiges Modell mit Bitcoin-Wochenende

Das vollständige Modell enthält dieselben Kontrollvariablen und zusätzlich die
Bitcoin-Wochenendrendite, -volatilität, -range und das -volumen.

Der direkte Vergleich beantwortet die Kernfrage:

> Verbessern Bitcoin-Wochenendinformationen die QQQ-Prognose gegenüber den
> bereits am Freitag bekannten Markt-, Sentiment- und Makroinformationen?

## 8. Zeitreihenvalidierung

### Expanding-window Walk-forward-Validierung

Wir trainieren immer auf der Vergangenheit und validieren auf einem späteren
Zeitraum. Eine einfache mögliche Fold-Struktur ist:

```text
Fold 1: Training 2018-2020, Validierung 2021
Fold 2: Training 2018-2021, Validierung 2022
Fold 3: Training 2018-2022, Validierung 2023
Fold 4: Training 2018-2023, Validierung 2024
Finaler Holdout: 2025 bis Datenstichtag
```

Innerhalb eines Validierungsjahres erzeugen wir für jeden verfügbaren Montag
eine Prognose mit dem bis dahin erlaubten Informationsstand. Die genaue
Refit-Häufigkeit darf je nach Laufzeit zwischen den Modellen variieren, muss
aber transparent dokumentiert werden.

## 9. Modelle

### Modell 0: Null-Gap-Baseline

$$
\hat y_t = 0.
$$

Diese Baseline nimmt an, dass QQQ am Montag auf dem Freitags-Schlusskurs öffnet.
Sie ist für kleine und schwer prognostizierbare Eröffnungsgaps ein wichtiger
Mindestvergleich.

### Modell 1: Historischer Mittelwert

$$
\hat y_t = \frac{1}{n_t}\sum_{i=1}^{n_t}y_i.
$$

Der Mittelwert wird an jedem Prognosezeitpunkt ausschliesslich aus vergangenen
Trainingsbeobachtungen berechnet.

### Modell 2: SARIMAX

Wir verwenden SARIMAX als traditionelle statistische Zeitreihenmethode:

$$
y_t = c + \beta^T x_t
+ \sum_{i=1}^{p}\phi_i y_{t-i}
+ \varepsilon_t
+ \sum_{j=1}^{q}\theta_j\varepsilon_{t-j}.
$$

Die externen Variablen $x_t$ enthalten die am Sonntag bekannten Features. Wir
wählen eine kleine Ordnung und vermeiden eine umfangreiche Parametersuche.
SARIMAX wird einmal ohne und einmal mit Bitcoin-Wochenendmerkmalen ausgewertet.

### Modell 3: XGBoost

XGBoost modelliert mögliche nichtlineare Beziehungen zwischen dem QQQ-Gap und
den Features. Wir verwenden konservative, vorab dokumentierte Parameter und
keine grosse Hyperparameteroptimierung.

Wir vergleichen ebenfalls das Kontroll- und das vollständige Feature-Set. Eine
kompakte Feature-Importance-Grafik dient der Interpretation der Modellnutzung,
nicht der kausalen Erklärung.

### Modell 4: Chronos-2

Chronos-2 repräsentiert das moderne Time Series Foundation Model der Challenge.
Wir verwenden das vortrainierte Modell zero-shot und trainieren kein Foundation
Model auf den wenigen Wochenbeobachtungen von Grund auf.

Chronos-2 prognostiziert den numerischen QQQ-Gap. Soweit die verwendete API dies
unterstützt, übergeben wir die am Sonntag bekannten Bitcoin-, Sentiment- und
Makrovariablen als Kovariaten. Der Median der Prognoseverteilung ist die
Punktprognose. Zusätzliche probabilistische Metriken sind nicht Teil der
Hauptauswertung.

## 10. Evaluation

### Mean Absolute Error

$$
MAE = \frac{1}{n}\sum_{t=1}^{n}|y_t-\hat y_t|.
$$

MAE ist unsere primäre Fehlermetrik für die numerische Gap-Prognose.

### Richtungsgenauigkeit

$$
Directional\ Accuracy
= \frac{1}{n}\sum_{t=1}^{n}
\mathbb{1}\left(\operatorname{sign}(y_t)
= \operatorname{sign}(\hat y_t)\right).
$$

Die Richtungsgenauigkeit zeigt leicht verständlich, wie oft ein Modell die
Richtung des Eröffnungsgaps korrekt erkennt.

### Ergebnisdarstellung

Die Haupttabelle bleibt kompakt:

- Modell,
- Feature-Set,
- MAE,
- Richtungsgenauigkeit,
- kurze Bemerkung.

Zusätzlich zeigen wir eine foldweise Tabelle oder Grafik, damit sichtbar wird,
ob ein Ergebnis nur aus einem einzelnen Jahr stammt. Auf komplexe Testbatterien
und zahlreiche weitere Metriken verzichten wir.

## 11. Interpretationslogik

Das Notebook beantwortet am Ende vier Fragen:

1. Schlägt ein Modell die Null- und Mittelwert-Baseline?
2. Verbessern Bitcoin-Wochenendmerkmale SARIMAX oder XGBoost?
3. Ist die Richtungsgenauigkeit über mehrere Jahre stabil?
4. Rechtfertigt Chronos-2 seinen zusätzlichen technischen Aufwand?

Wir interpretieren schwache oder negative Ergebnisse sachlich. Ein fehlender
Zusatznutzen von Bitcoin wäre ebenfalls ein gültiges Resultat, sofern die
Evaluation sauber und die Einschränkungen klar dokumentiert sind.

## 12. Aufbau des einen Notebooks

Das vollständige Projekt wird später in einem Notebook umgesetzt:

`notebooks/btc_weekend_qqq_forecasting.ipynb`

### Geplante Abschnitte

1. Fragestellung und Projektumfang
2. Setup und Reproduzierbarkeit
3. Datenquellen und Download
4. Datenprüfung, Zeitzonen und zeitliche Ausrichtung
5. Konstruktion des QQQ-Eröffnungsgaps
6. Konstruktion der Bitcoin-, Sentiment- und Makrofeatures
7. Explorative Datenanalyse
8. Expanding-window Backtesting
9. Einfache Baselines
10. SARIMAX
11. XGBoost
12. Chronos-2
13. Modellvergleich und Interpretation
14. Fazit und Limitationen

### Wiederkehrende Struktur jedes Abschnitts

Jeder inhaltliche Abschnitt folgt demselben Muster:

1. **Erklärung:** Wir beschreiben auf Deutsch in der Wir-Form, was wir machen,
   warum der Schritt nötig ist und wie die Methode funktioniert. Formeln werden
   mit LaTeX dargestellt.
2. **Code und Ergebnis:** Ein fokussierter Codeblock erzeugt eine kompakte
   Tabelle, eine Prüfung oder eine klar beschriftete Grafik.
3. **Interpretation:** Wir erklären direkt unter dem Ergebnis, was wir sehen,
   ob es plausibel ist und was es für den nächsten Schritt bedeutet.

Resultattexte werden erst anhand tatsächlich ausgeführter Notebook-Ausgaben
formuliert. Wir schreiben keine vorweggenommenen Interpretationen.

## 13. Schreib- und Visualisierungsregeln

### Sprache

- Markdown, Titel, Beschriftungen und Interpretationen sind auf Deutsch.
- Wir verwenden konsequent die Wir-Form.
- Variablennamen, Funktionsnamen und Codekommentare sind auf Englisch.
- Codezellen enthalten viele kurze `# comments in English`, die Zweck,
  Annahmen und nicht offensichtliche Transformationen erläutern.

### Tabellen und Grafiken

- Wir verwenden durchgehend die `viridis`-Farbpalette.
- Jedes Diagramm besitzt einen klaren deutschen Titel sowie beschriftete
  x- und y-Achsen mit Einheiten.
- Bei mehreren Reihen verwenden wir eine Legende und konsistente Modellfarben.
- Datumsbeschriftungen dürfen sich nicht überlappen.
- Tabellen bleiben kompakt und zeigen nur für die Argumentation relevante Werte.
- Jede Grafik beantwortet eine vorher formulierte analytische Frage.
- Wir verwenden keine dekorativen oder redundanten Diagramme.

## 14. Technische Umsetzung

### Apple Silicon und MPS

- Wir erkennen das verfügbare PyTorch-Gerät einmal im Setup.
- Für Chronos-2 bevorzugen wir `mps`, falls es stabil unterstützt wird.
- Andernfalls verwenden wir automatisch `cpu`.
- pandas, statsmodels, scikit-learn und XGBoost laufen auf der CPU.
- Wir verwenden auf MPS `float32` und vermeiden unnötige Tensortransfers.
- Kontextlänge und Batchgrösse bleiben konfigurierbar.
- `num_workers=0` ist die zuverlässige Grundeinstellung auf macOS.

### Wenige Hilfsfunktionen

Die wesentlichen Berechnungen bleiben sichtbar im Notebook. Eine `helpers.py`
wird nur angelegt, wenn eine kleine technische Funktion mehrfach benötigt wird,
beispielsweise für die Gerätewahl. Das Notebook muss vollständig verständlich
bleiben, ohne dass wir `helpers.py` öffnen.

### Lightning

Wir verwenden Lightning nicht. SARIMAX und XGBoost benötigen es nicht, und
Chronos-2 wird vortrainiert für Zero-shot-Inferenz eingesetzt. Dadurch bleibt
die Implementierung einfacher und besser nachvollziehbar.

## 15. Risiken und klare Grenzen

### Kleine Wochenstichprobe

Seit 2018 stehen nur einige hundert reguläre Wochenenden zur Verfügung. Wir
begrenzen deshalb die Feature-Anzahl, verwenden konservative Modelleinstellungen
und vermeiden umfangreiche Hyperparametersuchen.

### Zeitliche Ausrichtung

Fehler bei Zeitzonen oder Cutoffs könnten Look-ahead Leakage erzeugen. Wir
machen die Intervallgrenzen im Code sichtbar und prüfen einzelne Wochenenden
manuell in einer Tabelle.

### Schwaches Prognosesignal

QQQ-Eröffnungsgaps können schwer prognostizierbar sein. Deshalb vergleichen wir
alle Modelle mit starken einfachen Baselines und formulieren das Ergebnis als
empirische Antwort, nicht als erwarteten positiven Effekt.

### Generalisierbarkeit

Wir untersuchen ausschliesslich QQQ. Ergebnisse dürfen nicht ohne weitere Tests
auf den gesamten Aktienmarkt oder einzelne Aktien übertragen werden.

## 16. Quellen

- Time Series Challenge Aufgabenstellung.
- Hyndman und Athanasopoulos:
  [*Forecasting: Principles and Practice*](https://otexts.com/fpp3/).
- Marco Peixeiro:
  [`YT_03_forecasting_stats.ipynb`](https://github.com/marcopeix/youtube_tutorials/blob/main/YT_03_forecasting_stats.ipynb)
  als praktische Referenz für statistische Forecasting-Baselines.
- Chen und Guestrin (2016):
  [XGBoost](https://doi.org/10.1145/2939672.2939785).
- [Chronos-2 Technical Report](https://arxiv.org/abs/2510.15821) und
  [Chronos Repository](https://github.com/amazon-science/chronos-forecasting).
- Aktuelle Forschung zum Zusammenhang zwischen Kryptowährungsrenditen am
  Wochenende und Aktienrenditen am Montag:
  [*A crypto-stock weekend effect*](https://www.sciencedirect.com/science/article/pii/S1544612325019154).
- MachineLearningMastery:
  [Überblick über aktuelle Time Series Foundation Models](https://machinelearningmastery.com/the-2026-time-series-toolkit-5-foundation-models-for-autonomous-forecasting/).
