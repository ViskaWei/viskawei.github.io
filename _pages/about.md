---
permalink: /
title: "Hi"
excerpt: "About me"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I am a PhD at Johns Hopkins University, co-advised by [Prof. Alex Szalay](http://www.sdss.jhu.edu/~szalay) and [Prof. Fei Lu](https://sites.google.com/view/feilu). I did my undergrad at UC Berkeley majored in physics; master at Uchicago.

---

## Projects

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">

<!-- IPS Unlabeled Learning -->
<a href="https://viskawei.github.io/ips_unlabeled_learning_web" style="text-decoration: none; color: inherit;">
<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; background: #fff;">
<div style="height: 180px; background: linear-gradient(135deg, #0a0e17 0%, #1a2332 50%, #0f172a 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
<div style="text-align: center; color: white; z-index: 1;">
<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">&#x1F52C;</div>
<div style="font-size: 0.85rem; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase;">Interactive Demo</div>
</div>
<div style="position: absolute; inset: 0; background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(6,182,212,0.1) 0%, transparent 60%);"></div>
</div>
<div style="padding: 1.25rem;">
<h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">Learning from Unlabeled Particle Data</h3>
<p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.75rem;">Trajectory-free energy balance method for learning confinement and interaction potentials from interacting particle systems without particle labels. Neural networks + self-test loss achieve &lt;5% gradient error across 4 physical models.</p>
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
<span style="background: #eff6ff; color: #3b82f6; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">SDE</span>
<span style="background: #f0fdf4; color: #22c55e; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Neural Networks</span>
<span style="background: #faf5ff; color: #8b5cf6; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Inverse Problems</span>
<span style="background: #fefce8; color: #ca8a04; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Tikhonov</span>
</div>
</div>
</div>
</a>

<!-- Physics Informed ML -->
<a href="/research/physics/" style="text-decoration: none; color: inherit;">
<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; background: #fff;">
<div style="height: 180px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
<div style="text-align: center; color: white; z-index: 1;">
<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">&#x1F52D;</div>
<div style="font-size: 0.85rem; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase;">AI Telescope</div>
</div>
<div style="position: absolute; inset: 0; background: radial-gradient(circle at 40% 40%, rgba(139,92,246,0.2) 0%, transparent 60%);"></div>
</div>
<div style="padding: 1.25rem;">
<h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">Physics Informed Machine Learning</h3>
<p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.75rem;">Building physics-informed autoencoders for spectral analysis and designing AI telescope algorithms with reinforcement learning for optimal target selection in the PFS survey.</p>
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
<span style="background: #faf5ff; color: #8b5cf6; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Autoencoders</span>
<span style="background: #fef2f2; color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Spectroscopy</span>
<span style="background: #eff6ff; color: #3b82f6; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">RL</span>
</div>
</div>
</div>
</a>

<!-- Sketch & Streaming -->
<a href="/research/cs/" style="text-decoration: none; color: inherit;">
<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; background: #fff;">
<div style="height: 180px; background: linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0c4a6e 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
<div style="text-align: center; color: white; z-index: 1;">
<div style="font-size: 2.5rem; margin-bottom: 0.5rem;">&#x1F4CA;</div>
<div style="font-size: 0.85rem; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase;">Big Data Embedding</div>
</div>
<div style="position: absolute; inset: 0; background: radial-gradient(circle at 60% 60%, rgba(6,182,212,0.2) 0%, transparent 60%);"></div>
</div>
<div style="padding: 1.25rem;">
<h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">Sketch & Streaming Algorithms</h3>
<p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.75rem;">Geo-distributed tSNE and UMAP at scale. A preprocessing pipeline enabling linear scaling while preserving embedding quality, verified on healthcare and astrophysics datasets.</p>
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
<span style="background: #ecfeff; color: #0891b2; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Sketching</span>
<span style="background: #f0fdf4; color: #22c55e; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">tSNE/UMAP</span>
<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Distributed</span>
</div>
</div>
</div>
</a>

</div>

<style>
a > div:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}
</style>
