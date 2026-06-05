// Интерактивная обрезка фото перед сборкой спрайта.
// openCropOverlay(dataUrl) показывает модалку: фото + квадратная рамка, которую
// можно двигать (перетаскиванием) и масштабировать (угловой ручкой).
// Возвращает Promise<HTMLImageElement|null> — обрезанный квадрат в натуральном
// разрешении, либо null если пользователь отменил.
//
// Работает с DOM напрямую (модалка в index.html), без зависимостей.

export function openCropOverlay(dataUrl) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("crop-overlay");
    const stage = document.getElementById("crop-stage");
    const imgEl = document.getElementById("crop-image");
    const box = document.getElementById("crop-box");
    const btnOk = document.getElementById("crop-apply");
    const btnCancel = document.getElementById("crop-cancel");

    // Состояние рамки в координатах отображаемой картинки (CSS px внутри stage).
    let frame = { x: 0, y: 0, size: 0 };
    // Геометрия отрисованной картинки внутри stage (object-fit: contain).
    let fit = { left: 0, top: 0, width: 0, height: 0, scale: 1 };
    let natural = { w: 0, h: 0 };

    const cleanup = () => {
      overlay.style.display = "none";
      imgEl.onload = null;
      btnOk.onclick = null;
      btnCancel.onclick = null;
      box.onpointerdown = null;
      document.getElementById("crop-handle").onpointerdown = null;
      window.removeEventListener("resize", layout);
    };

    const finish = (result) => { cleanup(); resolve(result); };

    // Рассчитать, как картинка вписана в stage (contain), и стартовую рамку.
    const layout = (initFrame = false) => {
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      const ratio = natural.w / natural.h;
      let w, h;
      if (sw / sh > ratio) { h = sh; w = sh * ratio; }
      else { w = sw; h = sw / ratio; }
      fit.left = (sw - w) / 2;
      fit.top = (sh - h) / 2;
      fit.width = w;
      fit.height = h;
      fit.scale = natural.w / w; // display px → natural px

      imgEl.style.left = `${fit.left}px`;
      imgEl.style.top = `${fit.top}px`;
      imgEl.style.width = `${w}px`;
      imgEl.style.height = `${h}px`;

      if (initFrame || frame.size === 0) {
        const s = Math.min(w, h) * 0.7;
        frame = { x: fit.left + (w - s) / 2, y: fit.top + (h - s) / 2, size: s };
      } else {
        clampFrame();
      }
      drawFrame();
    };

    const clampFrame = () => {
      const minS = 20;
      frame.size = Math.max(minS, Math.min(frame.size, fit.width, fit.height));
      frame.x = Math.max(fit.left, Math.min(frame.x, fit.left + fit.width - frame.size));
      frame.y = Math.max(fit.top, Math.min(frame.y, fit.top + fit.height - frame.size));
    };

    const drawFrame = () => {
      box.style.left = `${frame.x}px`;
      box.style.top = `${frame.y}px`;
      box.style.width = `${frame.size}px`;
      box.style.height = `${frame.size}px`;
    };

    // Перетаскивание рамки.
    box.onpointerdown = (e) => {
      if (e.target.id === "crop-handle") return; // ресайз обрабатывается отдельно
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const ox = frame.x, oy = frame.y;
      const move = (ev) => {
        frame.x = ox + (ev.clientX - startX);
        frame.y = oy + (ev.clientY - startY);
        clampFrame(); drawFrame();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    // Ресайз угловой ручкой (квадрат остаётся квадратом).
    document.getElementById("crop-handle").onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX, startY = e.clientY;
      const oSize = frame.size;
      const move = (ev) => {
        const delta = Math.max(ev.clientX - startX, ev.clientY - startY);
        frame.size = oSize + delta;
        clampFrame(); drawFrame();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    btnCancel.onclick = () => finish(null);

    btnOk.onclick = () => {
      // Переводим рамку из display-координат в натуральные пиксели картинки.
      const nx = (frame.x - fit.left) * fit.scale;
      const ny = (frame.y - fit.top) * fit.scale;
      const ns = frame.size * fit.scale;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(ns);
      canvas.height = Math.round(ns);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgEl, nx, ny, ns, ns, 0, 0, canvas.width, canvas.height);

      const out = new Image();
      out.onload = () => finish(out);
      out.src = canvas.toDataURL("image/png");
    };

    // Запуск: грузим картинку, показываем модалку, раскладываем рамку.
    imgEl.onload = () => {
      natural = { w: imgEl.naturalWidth, h: imgEl.naturalHeight };
      overlay.style.display = "flex";
      // layout после показа — clientWidth/Height валидны только когда видимо.
      requestAnimationFrame(() => layout(true));
    };
    imgEl.src = dataUrl;
    window.addEventListener("resize", layout);
  });
}
