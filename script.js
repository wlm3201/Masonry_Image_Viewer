//倒排
//缓存
//历史
//复制 移动 删除
navigator.serviceWorker.register("sw.js");
class Queue {
  constructor(items = []) {
    this.items = items;
    this.getters = [];
  }
  push(item) {
    this.items.push(item);
    if (this.getters.length > 0) this.getters.shift()(this.items.shift());
  }
  shift() {
    if (this.items.length === 0)
      return new Promise((resolve) => this.getters.push(resolve));
    return this.items.shift();
  }
}
class Semaphore {
  constructor(value = 1) {
    this.value = value;
    this.queue = [];
  }
  async acquire() {
    if (this.value > 0) this.value--;
    else return new Promise((resolve) => this.queue.push(resolve));
  }
  release() {
    this.value++;
    if (this.queue.length > 0) this.queue.shift()();
  }
}
DataView.prototype.getUint24 = function (byteOffset, littleEndian) {
  if (littleEndian) {
    return (
      this.getUint8(byteOffset) |
      (this.getUint8(byteOffset + 1) << 8) |
      (this.getUint8(byteOffset + 2) << 16)
    );
  } else {
    return (
      (this.getUint8(byteOffset) << 16) |
      (this.getUint8(byteOffset + 1) << 8) |
      this.getUint8(byteOffset + 2)
    );
  }
};
function throttle(func, ms = 1000) {
  let timeout;
  let con = this;
  return function () {
    if (timeout) return;
    func.apply(con, arguments);
    timeout = setTimeout(() => (timeout = null), ms);
  };
}
function debounce(func, ms = 1000) {
  let timeout;
  let con = this;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(con, arguments), ms);
  };
}
function range(start, end, step = 1) {
  let arr = [];
  for (let i = start; i < end; i += step) arr.push(i);
  return arr;
}
function flatObj(obj, path) {
  obj = path.split("/").reduce((obj, name) => obj[name], obj);
  function recurse(obj) {
    for (let key in obj) {
      if (typeof obj[key] === "object") recurse(obj[key]);
      else arr.push(obj[key]);
    }
  }
  let arr = [];
  recurse(obj);
  return arr;
}
let MB = 1024 ** 2;
let GB = 1024 ** 3;
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < MB) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < GB) return `${(bytes / MB).toFixed(2)} MB`;
}
let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let log = console.log;
let docEl = document.documentElement;
let getEl = (id) => document.getElementById(id);
let newEl = (tag) => document.createElement(tag);
// #region elIds
let aspectratio = getEl("aspectratio");
let colcountinput = getEl("colcountinput");
let cover = getEl("cover");
let cursorplace = getEl("cursorplace");
let dirtree = getEl("dirtree");
let filtborder = getEl("filtborder");
let filtmono = getEl("filtmono");
let hint = getEl("hint");
let imgbox = getEl("imgbox");
let indicator = getEl("indicator");
let jumpTo = getEl("jumpTo");
let loadall = getEl("loadall");
let loadedcount = getEl("loadedcount");
let minheightinput = getEl("minheightinput");
let nextimg = getEl("nextimg");
let order = getEl("order");
let pause = getEl("pause");
let perload = getEl("perload");
let previmg = getEl("previmg");
let resort = getEl("resort");
let revert = getEl("revert");
let showcount = getEl("showcount");
let sidebar = getEl("sidebar");
let sidebtn = getEl("sidebtn");
let sortby = getEl("sortby");
let toend = getEl("toend");
let totalcount = getEl("totalcount");
let totop = getEl("totop");
let treebar = getEl("treebar");
let treebtn = getEl("treebtn");
// #endregion
let zoom;
let flextype;
let currdir;
let minCol;
let minR, maxR;
let held = false;
totalcount.value = 0;
loadedcount.value = 0;
showcount.value = 0;
let dircount = 0;
let loadingAll = 0;
let loading = 0;
let filting = 0;
let imgcols = [];
let marks = [];
let allData = new Map();
let toLoad = new Queue();
let visImgs = new Set();
let configs = [
  "colgap",
  "rowgap",
  "imgradius",
  "imgborder",
  "colcount",
  "minheight",
];
let enums = {
  colflex: "colflex",
  rowflex: "rowflex",
  default: "default",
  name: "name",
  date: "date",
  size: "size",
  asc: "asc",
  desc: "desc",
};
let imgObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) visImgs.add(e.target.index);
    else visImgs.delete(e.target.index);
  });
});
let dirObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) {
      currdir?.classList.remove("active");
      currdir?.classList.add("visited");
      currdir = getEl("li" + e.target.index);
      currdir.classList.add("active");
    }
  });
});
function initSort() {
  ["sortby", "order", "perload"].forEach((id) => {
    let store = localStorage.getItem(id);
    let select = getEl(id);
    if (store) select.value = store;
    select.onchange = (e) => localStorage.setItem(id, e.target.value);
  });
}
function initFilt() {
  ["filtmono", "filtborder", "revert"].forEach((id) => {
    let store = localStorage.getItem(id);
    let button = getEl(id);
    button.active = store === "true";
    if (button.active) button.classList.add("active");
    button.onclick = (e) => {
      let button = e.target;
      button.classList.toggle("active");
      button.active = button.classList.contains("active");
      localStorage.setItem(button.id, button.active);
      if (!filtmono.active && !filtborder.active && revert.active) return;
      reflow();
    };
  });
}
function initFlex() {
  let store = localStorage.getItem("flextype");
  flextype = store !== null ? store : enums.colflex;
  getEl(flextype).classList.add("active");
  imgbox.className = flextype;
  ["colflex", "rowflex"].forEach((id, i, arr) => {
    let el = getEl(id);
    el.onclick = (e) => {
      let button = e.target;
      if (flextype === button.id) return;
      flextype = button.id;
      localStorage.setItem("flextype", flextype);
      imgbox.className = flextype;
      arr.forEach((el) => getEl(el).classList.remove("active"));
      button.classList.add("active");
      reflow();
    };
  });
}
function initConfig(id) {
  let input = getEl(id + "input");
  input.oninput = (e) => (getEl(id).innerText = e.target.value);
  input.onchange = (e) => {
    let val = e.target.value;
    configs[id] = val;
    docEl.style.setProperty("--" + id, val + "px");
    localStorage.setItem(id, val);
  };
  let store = localStorage.getItem(id);
  if (store) input.value = store;
  input.onchange({ target: input });
  input.oninput({ target: input });
}
document.ondrop = async (e) => {
  if (e.dataTransfer.types[0] !== "Files") return;
  e.preventDefault();
  let items = [...e.dataTransfer.items].map((item) =>
    item.getAsFileSystemHandle()
  );
  initLoad();
  await handle(items);
  if (sortby.value !== enums.default || order.value !== enums.asc) reflow();
};
document.onpaste = async (e) => {
  if (e.clipboardData.types[0] !== "Files") return;
  let items = [...e.clipboardData.items].map((item) =>
    item.getAsFileSystemHandle()
  );
  initLoad();
  await handle(items);
  if (sortby.value !== enums.default || order.value !== enums.asc) reflow();
};
hint.onclick = async () => {
  let items = await showDirectoryPicker({
    mode: "readwrite",
    startIn: "pictures",
  });
  initLoad();
  await handle(items.values());
  if (sortby.value !== enums.default || order.value !== enums.asc) reflow();
};
function initLoad() {
  if (loadedcount.value > 0) return;
  if (sortby.value === enums.default && order.value === enums.asc) reflow();
  docEl.style.setProperty("--opacity", "0");
  hint.remove();
}
async function handle(items, dir = "", folderUl = dirtree.children[0]) {
  for await (let item of items) {
    let name = item.name;
    let path = dir + "/" + name;
    if (allData.has(path)) continue;
    if (item.kind === "directory") {
      dircount++;
      let val = totalcount.value,
        index = val + dircount;
      let li = newEl("li");
      li.innerText = name;
      li.id = "li" + index;
      li.index = index;
      folderUl.appendChild(li);
      let ul = newEl("ul");
      folderUl.appendChild(ul);
      toLoad.push(path);
      allData.set(path, index);
      await handle(item.values(), path, ul);
      if (val === totalcount.value) {
        li.style.display = "none";
        ul.style.display = "none";
      }
    }
    if (item.kind === "file") {
      let file = await item.getFile();
      if (!file.type.match(/image.*/)) continue;
      totalcount.value++;
      file.dir = dir;
      file.path = path;
      file.index = totalcount.value + dircount;
      allData.set(path, { file });
      toLoad.push(path);
      totalcount.innerText = totalcount.value;
    }
  }
}
function reflow(index = 0) {
  if (!filtmono.active && !filtborder.active && revert.active) return;
  imgbox.querySelectorAll(".mark").forEach((el) => {
    el.remove();
  });
  minCol = imgbox;
  marks = [];
  visImgs.clear();
  imgcols = [];
  if (flextype === enums.colflex) {
    for (let _ of Array(parseInt(colcountinput.value))) {
      let imgcol = newEl("div");
      imgcol.className = "imgcol";
      imgcols.push(imgcol);
      imgcol.onmouseout = addInfo;
    }
  }
  imgbox.replaceChildren(...imgcols);
  loading = 0;
  if (showcount.value > 0) {
    toLoad.getters.forEach((rsv) => rsv());
    toLoad.items = [...allData.keys()];
    showcount.value = 0;
  }
  if (index > 0) toLoad.items = toLoad.items.slice(index);
  let key = sortby.value;
  if (key !== enums.default)
    toLoad.items = toLoad.items
      .filter((p) => typeof allData.get(p) === "object")
      .sort((a, b) => allData.get(a).file[key] - allData.get(b).file[key]);
  if (order.value === enums.desc) toLoad.items.reverse();
  loadNext();
}
async function loadNext() {
  if (
    loading > 0 ||
    (!loadingAll &&
      docEl.scrollTop + docEl.clientHeight <
        minCol.scrollHeight - docEl.clientHeight)
  )
    return;
  for (let _ of Array(parseInt(perload.value))) {
    let path = await toLoad.shift();
    if (!path) return;
    let data = allData.get(path);
    if (typeof data === "number") {
      let mark = newEl("div");
      mark.index = data;
      dirObs.observe(mark);
      marks.push(mark);
      continue;
    }
    let file = data.file;
    let w, h, img;
    if (maxR) {
      if (file.width) [w, h] = [file.width, file.height];
      else {
        [w, h, img] = await getWH(file);
        [file.width, file.height] = [w, h];
        if (img) data.img = img;
      }
      if (h * minR > w + 2 || h * maxR < w - 2) continue;
    }
    let wrap = data.wrap;
    if (wrap) {
      loadImg(wrap);
      continue;
    }
    let onloaded = () => {
      URL.revokeObjectURL(img.src);
      loadedcount.innerText = loadedcount.value++ + 1;
      let wrap = newEl("div");
      wrap.className = "wrap";
      wrap.appendChild(img);
      data.wrap = wrap;
      loadImg(wrap);
      loading--;
      loadNext();
    };
    if (data.img) {
      img = data.img;
      onloaded();
    } else {
      img = new Image();
      data.img = img;
      loading++;
      img.onload = onloaded;
      img.onerror = onloaded;
      img.src = URL.createObjectURL(file);
    }
    img.index = file.index;
    img.alt = file.name;
    img.path = file.path;
  }
  setTimeout(loadNext, 0);
}
function addInfo(e) {
  let img = e.relatedTarget;
  if (img?.tagName !== "IMG") return;
  let wrap = img.parentElement;
  if (wrap.hasInfo) return;
  let file = allData.get(img.path).file;
  let imgInfo = [
    formatSize(file.size),
    `${img.naturalWidth}x${img.naturalHeight}`,
    file.lastModifiedDate.toLocaleString().replaceAll("/", "-"),
    file.name,
    file.dir,
  ];
  imgInfo = imgInfo.flatMap((t) => {
    let span = newEl("span");
    span.innerText = t;
    let br = newEl("br");
    return [span, br];
  });
  let infoBar = newEl("div");
  infoBar.classList.add("info");
  infoBar.replaceChildren(...imgInfo);
  wrap.appendChild(infoBar);
  wrap.hasInfo = 1;
}
function loadImg(wrap) {
  let img = wrap.children[0];
  if (
    ((filtmono.active && isMono(img)) ||
      (filtborder.active && isMonoBorder(img))) ^ revert.active
  )
    return;
  imgObs.observe(wrap);
  wrap.removeAttribute("style");
  showcount.innerText = showcount.value++ + 1;
  wrap.id = "img" + showcount.value;
  wrap.index = showcount.value;
  if (img.index > marks[0]?.index) wrap.appendChild(marks.shift());
  if (flextype === enums.colflex) {
    minCol = imgcols.reduce((prev, curr) =>
      prev.offsetHeight <= curr.offsetHeight ? prev : curr
    );
    minCol.appendChild(wrap);
  } else {
    resize(wrap);
    imgbox.appendChild(wrap);
  }
}
function resize(wrap) {
  let img = wrap.children[0],
    ratio = img.naturalWidth / img.naturalHeight;
  wrap.style.flexBasis = ratio * minheightinput.value + "px";
  wrap.style.flexGrow = ratio;
}
function isMonoBorder(img) {
  if (img.isMonoBorder !== undefined) return img.isMonoBorder;
  let { ctx, width, height } = getThumb(img);
  let d = (x, y, w, h) => ctx.getImageData(x, y, w, h).data;
  let wasd = [
    ...d(0, 0, 1, height),
    ...d(0, 0, width, 1),
    ...d(width - 1, 0, 1, height),
    ...d(0, height - 1, width, 1),
  ];
  let bns = [];
  for (let i of range(0, wasd.length, 4))
    bns.push(Math.round((wasd[i] + wasd[i + 1] + wasd[i + 2]) / 3 / 4));
  let counts = bns.reduce(
    (acc, curr) => acc.set(curr, (acc.get(curr) || 0) + 1),
    new Map()
  );
  if (Math.max(...counts.values()) > 0.0625 * wasd.length) {
    img.isMonoBorder = true;
    return true;
  }
  img.isMonoBorder = false;
  return false;
}
function isMono(img) {
  if (img.isMono !== undefined) return img.isMono;
  let { ctx, width, height } = getThumb(img);
  let pixels = width * height,
    data = ctx.getImageData(0, 0, width, height).data;
  for (let area of range(0, 4)) {
    let r = 0,
      g = 0,
      b = 0;
    for (let i of range(area * pixels, (area + 1) * pixels, 4)) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    if (Math.max(r, g, b) - Math.min(r, g, b) > pixels) {
      img.isMono = false;
      return false;
    }
  }
  img.isMono = true;
  return true;
}
function getThumb(img, l = 100) {
  let data = allData.get(img.path);
  if (l === 100) {
    let thumb = data.thumb;
    if (thumb) return thumb;
  }
  let canvas = newEl("canvas"),
    ctx = canvas.getContext("2d", { willReadFrequently: true }),
    wh = [img.naturalWidth, img.naturalHeight],
    m = Math.max(...wh),
    r = l / m;
  wh = wh.map((n) => Math.round(n * r));
  [canvas.width, canvas.height] = wh;
  ctx.drawImage(img, 0, 0, ...wh);
  let thumb = { canvas, ctx, width: wh[0], height: wh[1] };
  if (l === 100) data.thumb = thumb;
  return thumb;
}
function toggleZoom(e) {
  let oriimg = e.target;
  if (oriimg.className === "info") {
    if (!getSelection().isCollapsed) return;
    oriimg = oriimg.parentElement.children[0];
  } else if (oriimg.tagName !== "IMG") return;
  let rep = new Image();
  rep.id = "rep";
  rep.width = oriimg.naturalWidth;
  rep.height = oriimg.naturalHeight;
  oriimg.replaceWith(rep);
  zoom = oriimg;
  zoom.className = "zoom";
  zoom.style.top = (docEl.clientHeight - zoom.height) / 2 + "px";
  zoom.style.left = (docEl.clientWidth - zoom.width) / 2 + "px";
  zoom.scale =
    Math.min(
      docEl.clientHeight / zoom.height,
      docEl.clientWidth / zoom.width,
      1
    ).toFixed(2) - 0.01;
  zoom.style.scale = zoom.scale;
  zoom.minscale = zoom.scale;
  zoom.style.transform = `translateZ(0)`;
  cover.appendChild(zoom);
  cover.classList.add("show");
  cover.focus();
}
function zoomImg(e) {
  e.preventDefault();
  if (
    (e.deltaY < 0 && zoom.scale > 4) ||
    (e.deltaY > 0 && zoom.scale < zoom.minscale)
  )
    return;
  zoom.scale *= e.deltaY < 0 ? 1.25 : 0.8;
  moveImg(e);
}
function moveImg(e) {
  let t,
    l,
    ih = zoom.clientHeight * zoom.scale,
    iw = zoom.clientWidth * zoom.scale,
    dh = docEl.clientHeight,
    dw = docEl.clientWidth;
  if (ih > dh) {
    t = -(ih - dh + 0.2 * dh) * (e.clientY / dh - 0.5);
  } else t = 0;
  if (iw > dw) {
    l = -(iw - dw + 0.2 * dw) * (e.clientX / dw - 0.5);
  } else l = 0;
  zoom.style.scale = zoom.scale;
  zoom.style.translate = `${l}px ${t}px 0px`;
}
function hideCover() {
  zoom.removeAttribute("style");
  zoom.removeAttribute("class");
  getEl("rep").replaceWith(zoom);
  cover.classList.remove("show");
}
function copyImg(e) {
  let img = e.target;
  if (img.tagName !== "IMG") return;
  let { canvas } = getThumb(img, 1920);
  canvas.toBlob((blob) =>
    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  );
  e.preventDefault();
}
function naviZoom(e) {
  e.stopPropagation();
  let index = getEl("rep").parentElement.index;
  index +=
    e.target === nextimg || e.key === "ArrowRight" || e.key === "d" ? 1 : -1;
  let wrap = getEl("img" + index);
  if (!wrap) return;
  if (!visImgs.has(index)) wrap.scrollIntoView();
  hideCover();
  toggleZoom({ target: wrap.children[0] });
}
async function getWH(file) {
  if (file.size < 30) return [0, 0];
  let view = new DataView(await file.slice(0, 30).arrayBuffer());
  let sign = view.getUint32();
  if (sign === 0x89504e47) return [view.getUint32(16), view.getUint32(20)];
  else if (sign === 0x47494638)
    return [view.getUint16(6, true), view.getUint16(8, true)];
  else if (sign >>> 16 === 0x424d)
    return [view.getInt32(18, true), view.getInt32(22, true)];
  else if (sign === 0x52494646) {
    let vp8 = view.getUint32(12);
    if (vp8 === 0x56503820)
      return [view.getUint16(26, true), view.getUint16(28, true)];
    else if (vp8 === 0x56503858)
      return [view.getUint24(24, true) + 1, view.getUint24(27, true) + 1];
    else if (vp8 === 0x5650384c) {
      return [
        (view.getUint16(21, true) & 0x3fff) + 1,
        ((view.getUint24(22, true) >>> 6) & 0x3fff) + 1,
      ];
    }
  } else if (sign >>> 8 === 0xffd8ff) {
    view = new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
    let marker;
    let offset = 2;
    while (offset < view.byteLength) {
      marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xffc0 || marker === 0xffc2)
        return [view.getUint16(offset + 5), view.getUint16(offset + 3)];
      offset += view.getUint16(offset);
    }
  }
  let img = await new Promise((resolve) => {
    let img = new Image();
    let onloaded = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onload = onloaded;
    img.onerror = onloaded;
    img.src = URL.createObjectURL(file);
  });
  return [img.naturalWidth, img.naturalHeight, img];
}
function parseRatio() {
  let arr = [
    [" ", ""],
    ["—", "-"],
    ["--", "-"],
    ["：", ":"],
  ]
    .reduce((t, r) => t.replaceAll(...r), aspectratio.value)
    .split("-")
    .map((t, i) =>
      t === "" && i === 1
        ? Infinity
        : t
            .split(":")
            .map(Number)
            .reduce((p, c) => p / c)
    )
    .sort();
  [minR, maxR] = arr.concat(arr);
  reflow();
}
initFlex();
initSort();
initFilt();
configs.forEach(initConfig);
imgbox.onmouseout = addInfo;
imgbox.onmouseenter = addInfo;
cursorplace.onmouseout = addInfo;
cover.onwheel = zoomImg;
previmg.onclick = naviZoom;
nextimg.onclick = naviZoom;
cover.onmousemove = moveImg;
cover.onclick = hideCover;
resort.onclick = reflow;
window.onresize = loadNext;
imgbox.onclick = toggleZoom;
document.onscroll = loadNext;
document.ondragend = copyImg;
document.ondrag = (e) => e.preventDefault();
document.ondragover = (e) => e.preventDefault();
document.ondragenter = (e) => e.preventDefault();
pause.onclick = () => (loadingAll = 0);
totop.onclick = () => docEl.scrollTo(0, 0);
toend.onclick = () => docEl.scrollTo(0, docEl.scrollHeight);
sidebtn.onclick = () => sidebar.classList.add("show");
loadall.onclick = () => {
  loadingAll = 1;
  loadNext();
};
aspectratio.onkeydown = (e) => {
  if (e.key === "Enter") parseRatio();
};
treebtn.onclick = () => {
  treebar.classList.add("show");
  currdir?.scrollIntoView({ block: "center" });
};
jumpTo.onkeydown = (e) => {
  if (e.key === "Enter") getEl("img" + parseInt(jumpTo.value)).scrollIntoView();
};
colcountinput.addEventListener("change", () => {
  if (flextype === enums.colflex) reflow();
});
minheightinput.addEventListener("change", () => {
  if (flextype === enums.rowflex)
    requestAnimationFrame(() => {
      imgbox.querySelectorAll(".wrap").forEach(resize);
      loadNext();
    });
});
dirtree.onclick = (e) => {
  let li = e.target;
  if (li.tagName !== "LI") treebar.classList.remove("show");
  else if (sortby.value === enums.default && order.value === enums.asc)
    reflow(li.index - 1);
  e.stopPropagation();
};
dirtree.onwheel = (e) => {
  if (
    (dirtree.scrollTop === 0 && e.deltaY < 0) ||
    (dirtree.scrollTop + dirtree.clientHeight >= dirtree.scrollHeight &&
      e.deltaY > 0)
  )
    e.preventDefault();
};
document.addEventListener("mousedown", (e) => {
  if (e.button === 0) held = true;
});
document.addEventListener("mouseup", (e) => {
  if (e.button === 3) scrollBy(0, 0.9 * docEl.clientHeight);
  if (e.button === 4) scrollBy(0, -0.9 * docEl.clientHeight);
  if (e.button === 0) {
    held = false;
    indicator.classList.remove("show");
  }
  e.preventDefault();
});
document.addEventListener("scroll", () => {
  if (held) {
    let currIndex = Math.min(...visImgs);
    indicator.innerText = currIndex;
    indicator.classList.add("show");
  }
});
document.addEventListener(
  "click",
  (e) => {
    [sidebar, treebar].forEach((el) => {
      if (el.classList.contains("show") && !el.contains(e.target)) {
        el.classList.remove("show");
        e.stopPropagation();
      }
    });
  },
  true
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (cover.classList.contains("show")) hideCover();
    else if (treebar.classList.contains("show"))
      treebar.classList.remove("show");
    else sidebar.classList.toggle("show");
  }
  if (
    cover.classList.contains("show") &&
    ["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)
  )
    naviZoom(e);
});
