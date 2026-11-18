"use strict";

// Synthetic examples explain the seed policy; this page never connects to Robin.
const examples = {
  person: {
    tier: "interrupt", label: "Interrupt", title: "This one deserves you.",
    description: "A direct message from someone you’ve replied to before. Bring it to your attention.",
  },
  delivery: {
    tier: "silent", label: "Silent", title: "Keep the context. Carry on.",
    description: "An ordinary in-transit update can stay quiet. Arriving today, a required signature or a delivery problem would deserve attention.",
  },
  invoice: {
    tier: "batch", label: "Batch", title: "There’s a time for admin.",
    description: "Something needs your review, but it can wait for a batch. An approaching deadline can change that decision.",
  },
  newsletter: {
    tier: "silent", label: "Silent", title: "No interruption needed.",
    description: "A newsletter can stay quiet, with a line in the digest. It remains searchable when you want to come back to it.",
  },
};

const demo = document.querySelector("[data-demo]");
if (demo) {
  demo.querySelectorAll("[data-example]").forEach(button => {
    button.addEventListener("click", () => {
      const example = examples[button.dataset.example];
      if (!example) return;
      demo.querySelectorAll("[data-example]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      demo.querySelector("[data-tier]").textContent = example.label;
      demo.querySelector("[data-result-title]").textContent = example.title;
      demo.querySelector("[data-result-description]").textContent = example.description;
      demo.querySelectorAll("[data-route]").forEach(item => {
        item.classList.toggle("active", item.dataset.route === example.tier);
      });
    });
  });
}
