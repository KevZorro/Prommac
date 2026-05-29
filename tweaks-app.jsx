/* Prommac — Tweaks application layer.
   Applies tweak state to the (vanilla) page via CSS vars + body data-attrs. */
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSlider } = window;

const PROMMAC_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": ["#2bc4d4", "#13838f", "#04181b"],
  "type": "industrial",
  "vibe": "precision",
  "motion": 1
}/*EDITMODE-END*/;

const ACCENTS = [
  ["#2bc4d4", "#13838f", "#04181b"],  // petrol teal (brand default)
  ["#37a0e6", "#1c5f9e", "#04162b"],  // industrial blue
  ["#f5a524", "#a86a0c", "#241502"],  // hazard amber
  ["#a4e05a", "#5f8f23", "#0e1a02"]   // safety green
];

function PrommacTweaks() {
  const [t, setTweak] = useTweaks(PROMMAC_TWEAKS);

  React.useEffect(() => {
    const root = document.documentElement;
    const a = Array.isArray(t.accent) ? t.accent : ACCENTS[0];
    root.style.setProperty("--accent", a[0]);
    root.style.setProperty("--accent-deep", a[1]);
    root.style.setProperty("--accent-ink", a[2]);
    root.style.setProperty("--motion", String(t.motion));
    document.body.setAttribute("data-type", t.type);
    document.body.setAttribute("data-vibe", t.vibe);
    if (window.__prommacRefresh) window.__prommacRefresh();
  }, [t.accent, t.type, t.vibe, t.motion]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakColor
        label="Brand accent"
        value={t.accent}
        options={ACCENTS}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakSection label="Type system" />
      <TweakRadio
        label="Pairing"
        value={t.type}
        options={["industrial", "technical", "modern"]}
        onChange={(v) => setTweak("type", v)}
      />
      <TweakSection label="Atmosphere" />
      <TweakRadio
        label="Vibe"
        value={t.vibe}
        options={["precision", "cinematic", "futuristic"]}
        onChange={(v) => setTweak("vibe", v)}
      />
      <TweakSection label="Motion" />
      <TweakSlider
        label="Intensity"
        value={t.motion}
        min={0} max={1.4} step={0.1}
        onChange={(v) => setTweak("motion", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<PrommacTweaks />);
