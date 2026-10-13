# DECISIONS — actual prospective records

## D001 / A01 / 2026-10-13T03:20:55.451688+00:00
Decision: PROBE for Q1; not ADVANCE to a paper or large simulation.

Prior work actually read: Zhou et al., arXiv:2310.01475v1, statement and information-theoretic proof route; journal article DOI 10.1093/nsr/nwae287 (web text confirms approximate Markov -> exponential locality remains conjectured); Kato–Brandão arXiv:1609.06636v3 (relative-entropy Gibbs approximation); Tzeng–Möller arXiv:2509.03588v2 (XXZ ladder nonlocal entanglement spectra, explicitly broken SU(2), not the same all-SO(3) premise).

Question and value: Can the actual stated state-level hypotheses constrain the low spectrum of -log rho? A failure would require an extra hypothesis in the proposed information-theoretic proof; success would justify attempting a quantitative locality theorem. This concerns a concrete published proposed implication, not a self-created numerical shortcut.

Proposed diagnostic: Use a full-rank maximally mixed state plus a translation-invariant spin-singlet rank-one component. Compare trace/relative-entropy/CMI convergence with the exact modular gap. The idea already suggested algebraically during front review; this timestamp precedes numerical execution and full recorded derivation, not an external preregistration.

Discriminating conditions: verify SO(3) and one-site translation, clustering constants uniform in size, and CMI bounds for all partitions; do not rely on a finite-size gap fit. Check whether state construction requires nonlocal preparation; do not claim counterexample to a uniformly local gapped-bath subclass without proving that preparation.

Prediction: a small normalized statistical weight can remain order-one relative to an exponentially small eigenvalue, so entropic closeness may not imply spectral closeness.

Scope/budget: as in STATE, analytic derivation plus <=9 dense cases; no brute-force bath diagonalization.

Outcomes: if conditions fail, reject construction; if all state-level conditions hold, separate literal state-level counterexample from any stronger local-preparation conjecture, compare immediate literature and test a sufficient spectral stability repair. If prior work fully covers it, label known diagnostic, not a new contribution.

Strongest alternative not chosen: reproduce the published spin-1/2+spin-3/2 ladder. That is far more expensive and does not decide the norm/spectrum implication.

## A01 implementation event / 2026-10-13T03:23:20.633308+00:00
First numerical invocation reached JSON serialization and failed on a NumPy boolean. No result JSON was written; no scientific pass/fail is inferred. Preserve source pre-fix, convert check flags to Python bool, and rerun the same bounded diagnostic.

## A01 completed / 2026-10-13T03:25:57.405534+00:00
All nine bounded dense checks passed. Exact predictions confirmed: the modular gap is log(1+alpha); translation and total-spin residuals are negligible; tested CMI values are below the all-partition relative-entropy bound. Full conditional statement remains analytic, not a finite-size fit. Actual successful process: 0.82 s wall, 0.78 s user CPU, 0.03 s system CPU; internal numerical stage 0.0563 s. First invocation failed during serialization; numerical-stage wall time for that invocation was not recorded separately.

Interpretation: preserve a state-level obstruction to the approximate-Markov -> modular-spectrum implication. Do not claim to reproduce or contradict the paper's explicitly local spin-ladder examples. Published main text also motivates local system-bath coupling; this added preparation class must be audited separately. Supplementary ZIP is identified but not yet read (web tool rejects ZIP; container DNS unavailable).

## D002 / A02 / 2026-10-13T03:25:57.405534+00:00
Decision: PROBE, limited to scope/novelty assessment and a repair of the logical implication, not a new large simulation.
Question: What extra mode of approximation suffices to transfer a local Gibbs Hamiltonian's low spectral gap, and can low distinguishability alone ever certify it?
Action: derive operator-order/log-norm gap stability and a many-copy distinguishability necessary bound for the same explicit family; at most 4 analytic table rows and 4 further targeted literature queries. No additional dense model enlargement.
Outcome branches: (i) treat generic operator-log instability as known, not a discovery; (ii) retain a specific gap in the published state-level argument only if actual assumptions align; (iii) park general local-bath falsification without a physical construction; (iv) final report separates protocol behavior from high-value discovery.
Reason vs alternative: reproducing 40-spin ladder data cannot settle a hypothesis-to-spectrum implication and is not approved.

## User scope confirmation / 2026-10-13T03:29:17.115388+00:00
User confirmed 翟荟 / Hui Zhai. Continue A02; no new external service or Codex invocation. The earlier A01 results exist and are not regenerated as a new discovery. Reopened the original preprint, published main text and relevant follow-up to check scope. Search results with no relevant hits are not novelty evidence.

## A02 completed / 2026-10-13T03:33:00.065353+00:00
Derived a scalar-shift-invariant log-operator distance and spectral-gap stability repair, plus a many-copy discrimination necessary bound. Four 100-digit analytic table rows passed direct spectral-sum cross-checks. No large state was constructed for L=16,32,64; these entries evaluate proved formulas, not dense simulation. Computational stage wall time is recorded in artifacts/A02/sensitivity.json.

Scope audit: the published NSR main text still conjectures approximate spatial Markov -> exponential modular locality, but also motivates a local system-bath setting and refers to supplementary material. The exact mixed-state family settles insufficiency of state-level hypotheses, not a uniformly local gapped-purification subclass. The symmetry-broken XXZ follow-up already prevents claiming general novelty for nonlocal entanglement Hamiltonians.

## Protocol deviation recorded without backdating
After continuation, 9 visible search_query items were executed (3 identity/scope, 3 direct-prior, 3 novelty queries), whereas D002 had budgeted at most 4 additional targeted queries. Conservatively charging all continuation queries to D002 means 5 beyond that per-phase limit. No extra paid or dense work was launched. The previous broader initial allowance does not erase this local gate deviation. It is a real protocol-adherence defect, not hidden as additional authorization. Proposed fix: check remaining search allowance before each batch; separately allocate identity/scope work prospectively. No further search queries are authorized in this run.

Supplement access: container.download could not retrieve the ZIP because the web tool did not produce a successful viewed-file handle; earlier direct HTTP also failed DNS. No supplement contents were read or inferred.

## D003 / A03 / 2026-10-13T03:33:00.065371+00:00
Decision: ADVANCE only for evidence packaging and a bounded reproducibility check, not scientific scope expansion. Reexecute the two existing scripts in a new output directory, compare scientific fields excluding elapsed runtime, and inspect all files/links. Two commands, each timeout<=45 s and one numerical thread; no further web search, dense size increase, GitHub write, external agent or publication. Proof and scope audit are to be written from already obtained evidence. Outcome: discrepancy -> report and investigate within existing size; match -> label numerical replay only, not blind-agent validation.

## A03 completed / 2026-10-13T03:35:48.060772+00:00
Both scripts completed in new processes and fresh output paths. Scientific JSON fields exactly match previous outputs after excluding elapsed runtime. Existing A01 and A02 files preserved. Reproducibility is not an independent derivation or blind-host test. Final decisions: retain the proved state-level obstruction; PARK the physically local bath counterclaim and global novelty certification; no large simulation approved. Stop this bounded protocol test after evidence and report packaging, with the search-budget adherence defect recorded.