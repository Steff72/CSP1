# Notebook Concept: Bitcoin Realized Volatility Forecasting

## 1. Project Framing

### Core question
Can future Bitcoin realized volatility be forecasted better with external market indicators and modern foundation models than with simple and classical volatility baselines?

### Final project story
The project does not try to predict Bitcoin prices or prove a trading strategy. It focuses on realized volatility because volatility clustering is a well-known property of financial time series and is more defensible than short-term price direction prediction.

### Forecasting task
- Primary target: 7-day future realized volatility.
- Frequency: daily.
- Forecast origin: immediately after a completed Bitcoin UTC daily candle.
- Main comparison: simple baselines vs. GARCH vs. XGBoost vs. Chronos-2.

## 2. Data Scope

### Included data sources
- BTC-USD OHLCV from Yahoo Finance/yfinance.
- Fear & Greed Index from Alternative.me.
- VIX as equity-market volatility proxy.
- DXY as USD strength proxy.
- Nasdaq index as risk-asset proxy.

Reason for the selected scope: the chosen data sources cover Bitcoin market history, sentiment, equity-market volatility, USD strength and broader risk-asset behavior while keeping the dataset reproducible and manageable.

Only fully completed UTC daily candles are used. The notebook exposes a fixed,
exclusive data end date so that reruns use the same historical sample.

## 3. Dataset Design

### Base BTC columns
- `date`
- `btc_open`
- `btc_high`
- `btc_low`
- `btc_close`
- `btc_volume`

### External market columns
- `fear_greed`
- `vix_close`
- `dxy_close`
- `nasdaq_close`

### Derived BTC features
- `btc_log_return`
- `btc_abs_return`
- `btc_squared_return`
- `btc_high_low_range`
- `btc_volume_log`
- rolling volatility over 7, 14 and 30 days
- lagged returns over 1, 2, 3, 7 and 14 days
- lagged volatility over 1, 2, 3, 7 and 14 days

### Derived external features
- daily returns for VIX, DXY and Nasdaq
- lagged values for Fear & Greed, VIX, DXY and Nasdaq
- rolling changes over 7 and 14 days

## 4. Target Definition

### Log returns
For each day:

$$
r_t = \log\left(\frac{P_t}{P_{t-1}}\right)
$$

where \(P_t\) is the Bitcoin closing price on day \(t\).

### Future realized volatility
For the seven-day forecast horizon:

$$
\mathrm{RV}_{t,7} =
\sqrt{\sum_{i=1}^{7} r_{t+i}^{2}}
$$

Optional annualized version:

$$
\mathrm{RV}^{\mathrm{annualized}}_{t,7}
=
\mathrm{RV}_{t,7}\sqrt{\frac{365}{7}}
$$

### Target used in the project
Use non-annualized `target_rv_7` as the sole forecasting target in the
notebook. Annualized volatility can be shown in plots for interpretability,
but the model comparison uses the same non-annualized target throughout.

## 5. Leakage Rules

The project should explicitly enforce these rules:

- Features at date `t` may only use information available up to and including date `t`.
- The target for date `t` uses returns from `t+1` to `t+h`.
- Rolling features must be calculated backward-looking only.
- External variables must be shifted by at least one day if publication timing is unclear.
- Scaling, imputation and feature selection must be fitted inside each training fold only.
- The final holdout must not be used for EDA, feature selection or hyperparameter tuning.
- Training rows whose target window reaches a validation or holdout period must be purged.
- Source data must pass uniqueness, chronology, missingness and domain checks before features are calculated.

## 6. Feature Sets for Experiments

### Feature set A: BTC only
Purpose: establish a clean baseline using only Bitcoin market history.

Includes:
- lagged returns
- lagged realized volatility
- rolling volatility
- volume
- high-low range

### Feature set B: BTC + sentiment
Purpose: test whether market sentiment adds predictive value.

Adds:
- Fear & Greed Index
- lagged Fear & Greed
- 7-day Fear & Greed change

### Feature set C: BTC + macro/risk indicators
Purpose: test whether broader market conditions help.

Adds:
- VIX level
- returns/changes of VIX, DXY and Nasdaq

Raw DXY and Nasdaq levels are excluded from the main feature set because they
contain strong long-term trends. They may be tested only as a documented
ablation experiment.

### Feature set D: combined
Purpose: final feature set for XGBoost and optional covariate-aware Chronos-2 setup.

Includes:
- BTC features
- Fear & Greed
- VIX level and changes
- DXY returns and changes
- Nasdaq returns and changes

## 7. Exploratory Data Analysis

The EDA should answer practical modeling questions, not just show charts.

### Required plots
- BTC close price over time.
- BTC log returns over time.
- 7-day realized volatility over time.
- Distribution of realized volatility.
- Volatility during major high-volatility periods.
- Correlation heatmap of target and lagged features.
- Fear & Greed, VIX, DXY and Nasdaq aligned with BTC volatility.

### EDA questions
- Is volatility clustered?
- Are there clear regime changes?
- How strongly is the 7-day target right-skewed and regime-dependent?
- Do Fear & Greed, VIX, DXY or Nasdaq visibly move with BTC volatility?
- Are there missing-data periods or alignment problems?

## 8. Backtesting Design

### Do not use random splitting
Random train/test splitting is not valid for this project because it leaks future market regimes into the training data.

### Use walk-forward validation
Recommended setup:

```text
Fold 1: train 2018-2020, validate 2021
Fold 2: train 2018-2021, validate 2022
Fold 3: train 2018-2022, validate 2023
Fold 4: train 2018-2023, validate 2024
Final holdout: 2025 onward
```

Adjust dates based on available data at implementation time.

### Purge target overlap
For a validation period beginning at date \(v\), exclude every training origin
\(t\) whose target window reaches \(v\):

$$
t + h \geq v
$$

This prevents training labels from containing returns that belong to the
validation or holdout period.

### Forecast origins
Use all eligible daily rows for fitting the supervised models, but evaluate
only every seventh forecast origin:

```text
Train up to t, predict t+1 ... t+7
Move t forward by 7 days
Repeat
```

This produces non-overlapping evaluation targets, makes error comparisons
easier to interpret and reduces the runtime of GARCH and Chronos-2.

### Recommendation
Use purged expanding-window walk-forward backtesting with annual validation
folds, seven-day-spaced evaluation origins and one untouched final holdout.

## 9. Model Plan

### Model 0: Naive persistence
Forecast:

```text
predicted_rv_7_t = last_observed_rv_7_t
```

Purpose:
- This is the minimum benchmark.
- If advanced models cannot beat it, that is still an important result.

### Model 1: Window average
Forecast:

```text
predicted_rv_7_t = mean(rv_7 over previous 7/14/30 days)
```

Purpose:
- Slightly smoother baseline.
- Useful sanity check against overfitting.

### Model 2: GARCH
Use GARCH or GJR-GARCH on BTC returns.

Purpose:
- Classical volatility model.
- Strong finance-specific baseline.
- Directly aligned with the volatility-forecasting task.

For a simple GARCH(1,1), explain the conditional variance in the notebook as:

$$
\sigma_t^2 =
\omega + \alpha\epsilon_{t-1}^2 + \beta\sigma_{t-1}^2
$$

Here, \(\epsilon_{t-1}^2\) represents the most recent volatility shock and
\(\sigma_{t-1}^2\) the previously estimated conditional variance.

Implementation idea:
- Fit GARCH on returns within each training fold.
- Forecast volatility for the next horizon.
- Convert forecasted variance/volatility into the same scale as the realized-volatility target.

### Model 3: XGBoost
Use tabular supervised learning with lagged features.

Purpose:
- Tests nonlinear relationships.
- Can use BTC, sentiment and macro/risk features.
- Provides feature importance for interpretation.

Implementation idea:
- Refit at every seven-day-spaced forecast origin using only labels whose
  complete target window ends before that origin.
- Compare the predefined feature sets A-D with one fixed, conservative
  hyperparameter configuration.
- Model the logarithm of realized volatility and transform forecasts back to
  guarantee positive predictions.
- Average gain importance across the combined walk-forward models; interpret
  it as model usage, not causality.
- Add a small hyperparameter search only if the fixed configuration exposes a
  clear underfitting problem. Any tuning must remain inside the development
  period.

### Model 4: Chronos-2
Use Chronos-2 as the advanced time-series foundation model.

Purpose:
- Represents the modern model family requested by the challenge.
- Does not require training a foundation model from scratch.
- Can be compared against classical and ML baselines.

Implementation idea:
- Use the observed backward-looking `rv_7` series up to forecast origin \(t\)
  as the univariate context.
- Use the most recent 512 daily context values for every origin and keep
  `cross_learning=False`, so every forecast remains an independent univariate
  zero-shot prediction.
- Ask Chronos-2 for a seven-step forecast and use forecast step 7 as the
  prediction for `target_rv_7`:

$$
\widehat{\mathrm{target\_rv7}}_t
=
\widehat{\mathrm{rv7}}_{t+7}
$$

- Never use the forward-looking `target_rv_7` series as context because its
  current value is only known seven days later.
- Use the median as point forecast and the 10%/90% quantiles as an 80%
  prediction interval.
- Evaluate point forecasts, pinball loss and empirical interval coverage.
- Keep a covariate-aware Chronos-2 experiment optional; the primary comparison
  remains simple and univariate.

## 10. Metrics

### Main metrics
- MAE
- RMSE
- QLIKE

Define all three metrics in the notebook:

$$
\mathrm{MAE} =
\frac{1}{n}\sum_{i=1}^{n}\left|y_i-\hat{y}_i\right|
$$

$$
\mathrm{RMSE} =
\sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(y_i-\hat{y}_i\right)^2}
$$

For realized and predicted volatility, use normalized QLIKE:

$$
\mathrm{QLIKE} =
\frac{1}{n}\sum_{i=1}^{n}
\left(
\frac{y_i^2}{\hat{y}_i^2}
- \log\left(\frac{y_i^2}{\hat{y}_i^2}\right)
- 1
\right)
$$

### Relative metric
Report improvement versus naive persistence:

$$
\mathrm{Relative\ Improvement} =
1-\frac{\mathrm{Error}_{model}}{\mathrm{Error}_{naive}}
$$

### Optional probabilistic metrics
For Chronos-2:
- quantile loss / pinball loss
- empirical interval coverage

### Do not emphasize
- Accuracy
- Precision
- Recall
- F1

Those are classification metrics and only relevant if a separate direction/regime classification task is added later.

## 11. Result Tables

### Main model comparison
Columns:
- model
- feature_set
- horizon
- MAE
- RMSE
- QLIKE
- relative improvement vs. naive
- notes

### Fold-level comparison
Columns:
- fold
- train_period
- test_period
- model
- MAE
- RMSE
- QLIKE

### Feature-set comparison for XGBoost
Rows:
- BTC only
- BTC + Fear & Greed
- BTC + VIX/DXY/Nasdaq
- combined

## 12. Interpretation Plan

The notebook should answer:

- Is Bitcoin volatility forecastable above naive persistence?
- Does GARCH remain competitive?
- Does XGBoost benefit from Fear & Greed, VIX, DXY and Nasdaq?
- Does Chronos-2 outperform simpler methods, or is the advanced model not worth the added complexity?
- Are results stable across calm and volatile market periods?

## 13. Notebook Style and Implementation Rules

### Keep the notebook simple
- Keep the complete project in one notebook:
  `notebooks/bitcoin_volatility_forecasting.ipynb`.
- Extend this notebook section by section instead of creating separate
  notebooks for data preparation, modeling or evaluation.
- Use the smallest implementation that answers the research question.
- Prefer explicit, readable steps over abstractions and large helper frameworks.
- Keep configuration values such as dates, forecast horizon, random seed and paths in one visible setup cell.
- Avoid extensive hyperparameter tuning. Use a small, documented search space only where it adds value.
- Keep tables compact and show only columns and rows needed for the current argument.

### Language and writing style
- All markdown explanations, headings, captions and interpretations are written in German.
- Explanatory text consistently uses the first-person plural, for example: "Wir berechnen", "Wir vergleichen" and "Wir beobachten".
- Code, variable names, function names and code comments are written in English.
- Code cells contain many short `#` comments in English. The comments explain the purpose of steps, assumptions and non-obvious transformations instead of repeating the code literally.
- Technical terms can remain in English where this is standard, but they are explained in German when first introduced.

### Repeated structure for every substantive section
Each data, method and result section follows the same three-part pattern:

1. **Erklärung:** German markdown in the "Wir" form describes what we do, why the step is needed, how the method works and which assumptions apply. Mathematical definitions are shown as LaTeX equations.
2. **Code und Ergebnis:** A focused code cell performs the step and directly produces a compact table, diagnostic output or plot where useful.
3. **Interpretation:** We explain what the output shows, whether it is plausible and what it means for the next modeling step.

For setup and data-loading sections, the interpretation can be a short validation note such as date range, row count, missing values or device selection. We do not invent interpretations before the notebook has been executed; result text is completed from the actual outputs.

### Tables and plots
- Use the `viridis` color palette consistently across all plots.
- Use colors sampled from `matplotlib`'s `viridis` colormap for model comparisons and categorical series.
- Every plot has a clear German title, x-axis label, y-axis label and, where multiple series are shown, a legend.
- Include units in labels, for example volatility, percent or index points.
- Use consistent model colors across the complete notebook.
- Keep plots readable with an appropriate figure size, restrained grid lines and dates formatted without overlap.
- Display compact result tables with rounded values and descriptive German column labels where this improves readability.
- Do not use decorative plots. Each visualization must answer a stated analytical question.

### Apple Silicon and MPS
- Detect the available PyTorch device once in the setup section: prefer `mps`, otherwise use `cpu`.
- Use MPS only for PyTorch-based model inference or optional training. GARCH, XGBoost and normal pandas/scikit-learn processing remain on CPU.
- Avoid unnecessary tensor transfers between CPU and MPS.
- Use `float32` tensors on MPS and set deterministic random seeds where supported.
- Keep batch size and context length configurable so Chronos-2 inference can be reduced if unified memory is limited.
- Record the selected device and relevant package versions in a small reproducibility table.
- Keep `num_workers` conservative on macOS. Start with `0` for maximum notebook reliability and increase it only after a measured benefit.

### Minimal `helpers.py`
Use `helpers.py` only if a small function is reused and would otherwise distract from the analysis. Likely candidates are:

- selecting the PyTorch device;
- choosing a conservative worker count if parallel data loading is actually needed;
- applying one shared plot style.

All modeling logic, target construction, fold generation and evaluation remain visible in the notebook. Every imported helper is introduced in one sentence, and its behavior must be understandable from its name and call. The notebook must remain comprehensible without opening `helpers.py`.

### Lightning decision
Do not use Lightning by default. The planned GARCH and XGBoost models do not benefit from it, and Chronos-2 is initially used pretrained for zero-shot inference. Lightning is only introduced if we later fine-tune a PyTorch model and need a structured training loop, checkpointing or device management. In that case, the notebook still explains the model, data flow and training settings directly.

## 14. Notebook Structure

For all sections below, use the recurring sequence **Erklärung → Code/Output → Interpretation**. In the discussion and conclusion, the code/output step reuses compact result tables or diagnostics instead of introducing new calculations.

### 1. Setup
- imports
- configuration
- random seeds
- paths
- MPS/CPU device detection
- package and device summary table

### 2. Data loading
- BTC OHLCV
- Fear & Greed
- VIX
- DXY
- Nasdaq
- source, date range and row-count table
- fixed exclusive UTC data end date
- completed-candle and source-domain checks

### 3. Data cleaning and alignment
- date parsing
- daily calendar alignment
- missing values
- external feature lagging
- missing-value table before and after cleaning
- short interpretation of removed or imputed observations

### 4. Target construction
- log returns
- 7-day realized volatility
- target shifting
- LaTeX definitions before the code
- sample table and plausibility check after the code

### 5. Feature engineering
- BTC lag features
- rolling volatility features
- external market features
- final modeling table
- compact feature overview and leakage check

### 6. EDA
- volatility plots
- distributions
- correlation analysis
- regime observations
- one analytical question per plot
- German interpretation directly below each plot

### 7. Backtesting framework
- fold generation
- metric functions
- leakage-safe preprocessing
- purge training labels that overlap validation
- evaluate at seven-day-spaced forecast origins
- keep the 2025+ holdout untouched until final evaluation
- visual or tabular fold overview
- explain expanding-window validation and all metrics with LaTeX

### 8. Baseline models and GARCH
- explain MAE, RMSE and QLIKE with LaTeX
- include small deterministic metric-function checks
- naive persistence
- 30-day rolling volatility average
- GARCH(1,1), refitted at every seven-day-spaced evaluation origin
- aggregate the seven daily variance forecasts to the non-annualized
  seven-day realized-volatility target
- prediction table or plot
- interpretation against the minimum benchmark

### 9. Machine-learning model
- XGBoost
- feature-set comparison
- refit at each evaluation origin using only fully observed labels
- fixed conservative parameters before considering any tuning
- average gain importance across combined walk-forward models
- interpret both forecast performance and feature importance cautiously

### 10. Foundation model
- Chronos-2
- zero-shot forecast
- optional covariate experiment
- use MPS where supported and otherwise fall back to CPU
- report inference settings and runtime
- interpret whether the added complexity is justified

### 12. Results
- summary tables
- fold-level plots
- prediction vs. actual volatility
- use stable Viridis-derived colors for all models
- interpret average performance and variation across folds

### 13. Discussion
- what worked
- what did not work
- where external indicators helped
- whether Chronos-2 added value
- limitations
- compact robustness table by fold or volatility regime
- interpretation grounded in that table

### 14. Conclusion
- final answer to research question
- recommended next steps
- small code-generated final ranking of the compared models
- concise interpretation in German "Wir" form

## 15. Minimum Viable Notebook

If time becomes tight, the minimum viable version is:

1. BTC OHLCV only.
2. Target: 7-day realized volatility.
3. Models: naive persistence, GARCH, XGBoost, Chronos-2.
4. Walk-forward validation.
5. MAE/RMSE comparison.
6. Short discussion of limitations.

Then add Fear & Greed, VIX, DXY and Nasdaq as the first extension.

## 16. Main Risks and Mitigations

### Risk: data alignment leakage
Mitigation: shift external variables by one day when publication timing is unclear.

### Risk: incomplete current-day candle
Mitigation: use a fixed exclusive UTC end date and validate OHLC consistency
before calculating returns.

### Risk: target overlap across folds
Mitigation: purge training rows whose seven-day target reaches validation and
evaluate on non-overlapping seven-day-spaced forecast origins.

### Risk: holdout contamination
Mitigation: restrict EDA, feature selection and tuning to data before 2025 and
evaluate the 2025+ holdout once at the end.

### Risk: too many feature variants
Mitigation: use the four predefined feature sets only.

### Risk: GARCH scale mismatch
Mitigation: document clearly whether GARCH predicts daily volatility or horizon volatility and transform consistently.

### Risk: Chronos-2 setup takes too long
Mitigation: keep the rest of the pipeline complete first; Chronos-2 can be added as the final advanced comparison.

### Risk: MPS incompatibility or memory pressure
Mitigation: detect support at runtime, keep batch size configurable and provide a CPU fallback without changing the analytical workflow.

### Risk: too much abstraction
Mitigation: keep core calculations in the notebook and restrict `helpers.py` to a few transparent technical utilities.

### Risk: simple baselines win
Mitigation: treat this as a valid and interesting result. The project asks whether modern models help, not to prove that they always do.

## 17. Expected Final Message

The most likely strong final conclusion will look like one of these:

- "Simple volatility persistence is difficult to beat, but GARCH/XGBoost improves performance in specific regimes."
- "External indicators add limited average value but help during high-volatility periods."
- "Chronos-2 is competitive, but its added complexity is only justified if it improves 7-day volatility forecasts or uncertainty estimates."

Any of these outcomes is suitable for the challenge as long as the backtesting is clean and the comparison is fair.
