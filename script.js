const header = document.querySelector(".site-header");
const toggleBtn = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav a");

toggleBtn.addEventListener("click", () => {
  const isOpen = header.classList.toggle("menu-open");
  toggleBtn.setAttribute("aria-expanded", isOpen);
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    header.classList.remove("menu-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  });
});
