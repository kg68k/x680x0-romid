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
    const sha256 = await getSha256String(event.target.result);
    printRomInfo(file.size, sha256);
  };
  reader.readAsArrayBuffer(file);
}

function printRomInfo(size, sha256) {
  setText("sha256", sha256);

  const romInfo = RomData.find(obj => obj.size === size && obj.sha256 === sha256);
  if (!romInfo) {
    setErrorMessage("一致するハッシュ値がありません。未知のデータです。");
    return;
  }

  for (const [k, v] of Object.entries(romInfo)) {
    if (k === "url") {
      setLink(k, v, v);
    }
    else if (k !== "size" && k !== "sha256") {
      setText(k, v);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#input_file").addEventListener("change", updateRomInfo, false);
});

