(function () {
  "use strict";

  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.getElementById("keys");

  const opSymbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  let displayValue = "0";
  let storedValue = null;
  let pendingOp = null;
  let freshEntry = true;

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "오류";
    const s = String(n);
    if (s.includes("e") || s.length > 12) {
      const exp = n.toExponential(6);
      return exp.replace(/\.?0+e/, "e");
    }
    const rounded = Math.round(n * 1e10) / 1e10;
    return String(rounded);
  }

  function updateDisplay() {
    displayEl.textContent = displayValue;
  }

  function updateExpression() {
    if (storedValue !== null && pendingOp) {
      const sym = opSymbols[pendingOp] || pendingOp;
      expressionEl.textContent = `${formatNumber(storedValue)} ${sym}`;
    } else {
      expressionEl.textContent = "";
    }
  }

  function setActiveOp(btn) {
    keysEl.querySelectorAll(".key-op[data-action='operator']").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
  }

  function clearActiveOp() {
    keysEl.querySelectorAll(".key-op[data-action='operator']").forEach((b) => {
      b.classList.remove("is-active");
    });
  }

  function applyOp(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function inputDigit(d) {
    if (displayValue === "오류") {
      clearAll();
    }
    if (freshEntry) {
      displayValue = d === "0" ? "0" : d;
      freshEntry = false;
    } else {
      if (displayValue === "0" && d !== "0") displayValue = d;
      else if (displayValue === "0" && d === "0") return;
      else if (displayValue.replace(".", "").length < 12) displayValue += d;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (displayValue === "오류") {
      clearAll();
    }
    if (freshEntry) {
      displayValue = "0.";
      freshEntry = false;
    } else if (!displayValue.includes(".")) {
      displayValue += ".";
    }
    updateDisplay();
  }

  function commitPending() {
    if (storedValue === null || pendingOp === null) return;
    const cur = parseFloat(displayValue);
    if (Number.isNaN(cur)) return;
    const result = applyOp(storedValue, cur, pendingOp);
    displayValue = formatNumber(result);
    if (displayValue === "오류") freshEntry = true;
    storedValue = null;
    pendingOp = null;
    clearActiveOp();
    updateDisplay();
    updateExpression();
  }

  function chooseOperator(op, btn) {
    const cur = parseFloat(displayValue);
    if (Number.isNaN(cur)) return;

    if (storedValue !== null && pendingOp !== null && !freshEntry) {
      const result = applyOp(storedValue, cur, pendingOp);
      if (!Number.isFinite(result)) {
        displayValue = "오류";
        storedValue = null;
        pendingOp = null;
        freshEntry = true;
        clearActiveOp();
        updateDisplay();
        updateExpression();
        return;
      }
      storedValue = result;
      displayValue = formatNumber(result);
    } else {
      storedValue = cur;
    }

    pendingOp = op;
    freshEntry = true;
    setActiveOp(btn);
    updateDisplay();
    updateExpression();
  }

  function toggleSign() {
    if (displayValue === "오류") return;
    if (displayValue.startsWith("-")) displayValue = displayValue.slice(1);
    else if (displayValue !== "0") displayValue = "-" + displayValue;
    updateDisplay();
  }

  function percent() {
    if (displayValue === "오류") return;
    const n = parseFloat(displayValue);
    if (Number.isNaN(n)) return;
    displayValue = formatNumber(n / 100);
    updateDisplay();
  }

  function clearAll() {
    displayValue = "0";
    storedValue = null;
    pendingOp = null;
    freshEntry = true;
    clearActiveOp();
    updateDisplay();
    updateExpression();
  }

  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".key");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "digit") {
      inputDigit(btn.dataset.value);
    } else if (action === "decimal") {
      inputDecimal();
    } else if (action === "operator") {
      chooseOperator(btn.dataset.value, btn);
    } else if (action === "equals") {
      commitPending();
      freshEntry = true;
    } else if (action === "clear") {
      clearAll();
    } else if (action === "sign") {
      toggleSign();
    } else if (action === "percent") {
      percent();
    }
  });

  const keyMap = {
    Enter: "equals",
    "=": "equals",
    Escape: "clear",
    Backspace: "backspace",
    "%": "percent",
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const k = e.key;
    if (k >= "0" && k <= "9") {
      e.preventDefault();
      inputDigit(k);
      return;
    }
    if (k === ".") {
      e.preventDefault();
      inputDecimal();
      return;
    }
    if (k === "+" || k === "-" || k === "*" || k === "/") {
      e.preventDefault();
      const opBtn = keysEl.querySelector(`.key-op[data-action="operator"][data-value="${k}"]`);
      chooseOperator(k, opBtn);
      return;
    }

    const mapped = keyMap[k];
    if (mapped === "equals") {
      e.preventDefault();
      commitPending();
      freshEntry = true;
    } else if (mapped === "clear") {
      e.preventDefault();
      clearAll();
    } else if (mapped === "backspace") {
      e.preventDefault();
      if (displayValue === "오류") {
        clearAll();
        return;
      }
      if (!freshEntry && displayValue.length > 1) {
        displayValue = displayValue.slice(0, -1);
      } else {
        displayValue = "0";
        freshEntry = true;
      }
      updateDisplay();
    } else if (mapped === "percent") {
      e.preventDefault();
      percent();
    }
  });

  updateDisplay();
  updateExpression();
})();
