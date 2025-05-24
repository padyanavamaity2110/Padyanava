function toggleMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const menuIcon = document.getElementById('menu-icon');

  if (sideMenu.classList.contains('open')) {
    sideMenu.classList.remove('open');
    menuIcon.textContent = '☰'; // back to hamburger
  } else {
    sideMenu.classList.add('open');
    menuIcon.textContent = ''; // hide hamburger when menu is open
  }
}


function applyTheme(theme) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(`${theme}-mode`);
  localStorage.setItem("theme", theme);
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const activeTheme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(activeTheme);

  const themeToggleCheckbox = document.getElementById("theme-toggle-checkbox");
  if (themeToggleCheckbox) {
    themeToggleCheckbox.checked = (activeTheme === "dark");

    themeToggleCheckbox.addEventListener("change", () => {
      const newTheme = themeToggleCheckbox.checked ? "dark" : "light";
      applyTheme(newTheme);
    });
  }

  document.querySelectorAll("header, nav, section").forEach(el => {
    el.classList.add("fade-in");
  });

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const mobileToggle = document.querySelector(".menu-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      document.querySelector(".nav-menu").classList.toggle("show");
    });
  }
});