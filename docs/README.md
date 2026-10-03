# Blog zum CSP1 Projekt

Der vollständige Blog liegt als gestaltete Webseite in `index.html` und als übertragbarer Artikel in `BLOG.md` vor. Beide Versionen enthalten denselben Beitrag von Sandro Balz und Stefan Binkert.

## Ansehen

`index.html` lässt sich direkt im Browser öffnen. Die Seite benötigt keine Installation und keine Internetverbindung für Text, Bilder oder Gestaltung. Externe Quellenlinks benötigen eine Internetverbindung.

## Veröffentlichung auf GitHub Pages

Die Blogadresse lautet [Bitcoin als Frühindikator für den QQQ Eröffnungsgap](https://steff72.github.io/CSP1/).

Im GitHub-Repository `Steff72/CSP1` ist unter **Settings → Pages** die Veröffentlichung aus dem Branch **main** und dem Ordner **/docs** eingerichtet. Nach einem Commit und Push von Änderungen an diesem Ordner aktualisiert GitHub Pages die Seite automatisch. Die `.nojekyll`-Datei sorgt für die Auslieferung als statische Seite.

Für Kaggle oder einen anderen Blog kann `BLOG.md` als Artikelgrundlage verwendet werden. Die Bilddateien in `assets/charts` und `assets/illustrationen` müssen dort ebenfalls hochgeladen und die Bildverweise an die Plattform angepasst werden.

## Quellen der Abbildungen

Die sechs Dateien in `assets/charts` wurden direkt aus den gespeicherten PNG-Ausgaben des ausgeführten Notebooks extrahiert. Sie wurden weder neu berechnet noch zugeschnitten oder farblich verändert. `assets/quellen.json` dokumentiert die Notebook-Zellen, Ausgaben und SHA-256-Prüfsummen.

Die beiden Illustrationen wurden aus den Seiten 2 und 12 von `slides/Predicting_QQQ_Gaps_via_Bitcoin.pdf` ausgeschnitten. Sie enthalten keine übernommenen Ergebnisdiagramme. Die Folien wurden mit NotebookLM erstellt; es werden hier ihre schematischen Illustrationen verwendet.

`material/btc_overnight_qqq_forecasting.ipynb` ist eine unveränderte Kopie des ausgeführten Projekt-Notebooks zum Stand dieses Beitrags. Dadurch funktioniert dessen Download auch bei einer Veröffentlichung nur des `/docs`-Ordners. Bei einer späteren Aktualisierung müssen Artikel, Charts, Quellenverzeichnis und Notebookkopie zusammen aktualisiert werden.

Die Webseite wird aus `BLOG.md` mit `render-blog.mjs` erzeugt. Der Generator verwendet das im Codex-Arbeitsruntime vorhandene Paket `marked`. Für eine Ausführung ausserhalb dieser Umgebung kann dessen Modulpfad als Argument übergeben werden:

```bash
node docs/render-blog.mjs /absoluter/pfad/zu/marked/lib/marked.esm.js
```
