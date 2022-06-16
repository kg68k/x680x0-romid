const ROMSIZE_MAX = 1024*1024;

function setText(id, text) {
  const e = document.getElementById(id);
  e.appendChild(document.createTextNode(text));
}

function setLink(id, text, href) {
  const a = document.createElement('a');
  a.href = href;
  a.target = "_blank";
  a.appendChild(document.createTextNode(text));

  const e = document.getElementById(id);
  e.appendChild(a);
}

function clearAllInfo() {
  document.querySelectorAll(".info").forEach((e) => {
    while (e.lastChild) {
      e.removeChild (e.lastChild);
    }
  });
}

function setErrorMessage(text) {
  setText("error_message", "エラー: " + text);
}

function clearErrorMessage() {
  const e = document.querySelector("#error_message");
  while (e.lastChild) {
      e.removeChild (e.lastChild);
    }
}

async function getSha256String(data) {
  const hash = await crypto.subtle.digest("SHA-256", data);
  const text = Array.from(new Uint8Array(hash)).map(v => v.toString(16).padStart(2, "0")).join("");
  return text.toUpperCase();
}

function updateRomInfo () {
  clearErrorMessage();
  clearAllInfo();

  const file = this.files[0];
  const filesize = file.size.toLocaleString() + " (" + (file.size / 1024) + "KiB)";
  setText("size", filesize);

  if (file.size > ROMSIZE_MAX) {
    setErrorMessage("ファイルサイズが大きすぎます。");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const fileData = event.target.result;

    const sha256 = await getSha256String(fileData);
    const romInfo = findRomInfo(file.size, sha256);
    if (romInfo) {
      printRomInfo(file.size, sha256, romInfo, "");
      return;
    }

    const name = extractEmbeddedName(file.size, fileData);
    if (name) {
      const mod_data = fillEmbeddedNameByFF(file.size, fileData);
      const mod_sha256 = await getSha256String(mod_data);
      const mod_romInfo = findRomInfo(file.size, mod_sha256);
      if (mod_romInfo) {
        printRomInfo(file.size, mod_sha256, mod_romInfo, name);
        return;
      }
    }

    setText("sha256", sha256);
    setErrorMessage("一致するハッシュ値がありません。未知のデータです。");
  };
  reader.readAsArrayBuffer(file);
}

function findRomInfo(size, sha256) {
  return RomData.find(obj => obj.size === size && obj.sha256 === sha256);
}

function printRomInfo(size, sha256, romInfo, name) {
  setText("sha256", sha256);
  setText("embeddedname", name);

  for (const [k, v] of Object.entries(romInfo)) {
    if (k === "url") {
      setLink(k, v, v);
    }
    else if (k !== "size" && k !== "sha256") {
      setText(k, v);
    }
  }
}

function extractEmbeddedName(size, fileData) {
  if (![128*1024, 256*1024, 1024*1024].includes(size)) {
    return null;
  }

  const d = Array.from(new Uint8Array(fileData, size-32, 4));
  const s = d.map(v => String.fromCharCode(v)).join("");
  if (s != 'NAME') {
    return null;
  }

  const n = Array.from(new Uint8Array(fileData, size-28));
  const nul_pos = n.indexOf(0);
  n.length = (nul_pos >= 0) ? nul_pos : n.length;

  function toPrintable(c) {
    if (0x20 <= c && c <= 0x7e) {
      return String.fromCharCode(c);
    }
    return "\\x" + c.toString(16).padStart(2, '0');
  }
  return n.map(c => toPrintable(c)).join("");
}

function fillEmbeddedNameByFF(size, fileData) {
  const data = fileData.slice(0);
  new Uint8Array(data, size-32).fill(0xff);
  return data;
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#input_file").addEventListener("change", updateRomInfo, false);
});

