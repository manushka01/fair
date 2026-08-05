// eligibility.js
// Step 1: postcode entry + validation.
// Step 2a: if the postcode has known addresses, show a searchable address list.
// Step 2b: if not, fall back to manual house name/number + street entry.
// Step 3: property type (single-select).
// Step 4: home improvements (multi-select checkboxes).
// Step 5: homeowner or renter (single-select).
// Step 5b: gas supply (single-select Yes/No).
// Step 5c: benefits (single-select bubbles, not a dropdown).

document.addEventListener('DOMContentLoaded', () => {

  // ---------------------------------------------------------------
  // Address lookup via getAddress.io (free tier available).
  //
  // HOW TO GET YOUR FREE API KEY:
  //   1. Go to https://getaddress.io and click "Get started for free"
  //   2. Sign up (no card needed for the free plan)
  //   3. Copy your API key from the dashboard
  //   4. Paste it below, replacing 'YOUR_API_KEY_HERE'
  //
  // The free plan includes a limited number of look-ups per month -
  // fine for development and small/medium traffic. If you outgrow it,
  // the paid tiers are pay-as-you-go.
  // ---------------------------------------------------------------
  function normalizePostcode(value) {
    return value.trim().toUpperCase().replace(/\s+/g, '');
  }

  const GETADDRESS_API_KEY = 'YOUR_API_KEY_HERE';

  // Small offline fallback so the flow still demos correctly before
  // you've added a real key (or if the API call fails/rate-limits).
  const MOCK_ADDRESS_DB = {
    // Liverpool
    'L18JQ': [
      '1 Castle Chambers, China Street',
      '1 China Street',
      '2 Castle Chambers, China Street',
      '3 Castle Chambers, China Street',
      '14a China Street',
    ],
    // Manchester
    'M11AE': [
      '1 Piccadilly Gardens',
      '2 Piccadilly Gardens',
      'Flat 3, Piccadilly Gardens',
      '10 Market Street',
    ],
    // London - Westminster
    'SW1A1AA': [
      'Buckingham Palace',
    ],
    'SW1A2AA': [
      '10 Downing Street',
      '11 Downing Street',
      '12 Downing Street',
    ],
    // Birmingham
    'B11AA': [
      '1 New Street',
      '3 New Street',
      'Flat 2, 5 New Street',
      '22 Corporation Street',
    ],
    // Leeds
    'LS11AA': [
      '4 Boar Lane',
      '6 Boar Lane',
      '15 Park Row',
      'Suite 2, 15 Park Row',
    ],
    // Edinburgh
    'EH11AA': [
      '1 Princes Street',
      '5 Princes Street',
      '18 George Street',
    ],
    // Glasgow
    'G11AA': [
      '2 Sauchiehall Street',
      '9 Sauchiehall Street',
      '21 Buchanan Street',
    ],
    // Bristol
    'BS11AA': [
      '3 Corn Street',
      '7 Corn Street',
      '12 Park Street',
    ],
    // Sheffield
    'S11AA': [
      '5 Fargate',
      '11 Fargate',
      '2 Division Street',
    ],
    // Cardiff
    'CF101AA': [
      '1 Queen Street',
      '4 Queen Street',
      '9 St Mary Street',
    ],
    // Belfast
    'BT11AA': [
      '2 Donegall Square',
      '6 Donegall Square',
      '14 Royal Avenue',
    ],
    // Newcastle
    'NE11AA': [
      '3 Grey Street',
      '8 Grey Street',
      '20 Northumberland Street',
    ],
    // Nottingham
    'NG11AA': [
      '1 Old Market Square',
      '5 Old Market Square',
      '17 Clumber Street',
    ],
    // Oxford
    'OX11AA': [
      '2 High Street',
      '6 High Street',
      '11 Cornmarket Street',
    ],
    // Cambridge
    'CB11AA': [
      '3 Market Street',
      '7 Market Street',
      '15 Bridge Street',
    ],
    // Southampton
    'SO141AA': [
      '1 Above Bar Street',
      '4 Above Bar Street',
      '9 High Street',
    ],
    // Brighton
    'BN11AA': [
      '2 North Street',
      '5 North Street',
      '18 Western Road',
    ],
    // York
    'YO11AA': [
      '3 Coney Street',
      '7 Coney Street',
      '12 Stonegate',
    ],
    // Norwich
    'NR11AA': [
      '1 London Street',
      '4 London Street',
      '9 Castle Street',
    ],
    // Plymouth
    'PL11AA': [
      '2 Royal Parade',
      '6 Royal Parade',
      '13 Armada Way',
    ],
  };

  async function lookupAddressesForPostcode(rawPostcode) {
    const postcode = rawPostcode.trim();

    if (GETADDRESS_API_KEY === 'YOUR_API_KEY_HERE') {
      // No key configured yet - use the offline demo data so you can
      // still see and test the full flow.
      const key = normalizePostcode(postcode);
      return MOCK_ADDRESS_DB[key] || [];
    }

    try {
      // 'all=true' with a postcode-only query returns every address at
      // that postcode in one look-up (counts as a single credit).
      const res = await fetch(
        `https://api.getAddress.io/autocomplete/${encodeURIComponent(postcode)}?api-key=${GETADDRESS_API_KEY}&all=true`
      );
      const data = await res.json();

      if (!data.suggestions) return [];
      return data.suggestions.map((s) => s.address);
    } catch (err) {
      console.warn('getAddress.io lookup failed', err);
      return [];
    }
  }

  // ---------------------------------------------------------------
  // Step navigation (simple history stack so Previous always
  // goes back to wherever the user actually came from).
  // ---------------------------------------------------------------
  const stepEls = {
  'step-1': document.getElementById('step-1'),
  'step-2a': document.getElementById('step-2a'),
  'step-2b': document.getElementById('step-2b'),
  'step-3': document.getElementById('step-3'),
  'step-4': document.getElementById('step-4'),
  'step-5': document.getElementById('step-5'),
  'step-5b': document.getElementById('step-5b'),
  'step-5c': document.getElementById('step-5c'),
  'step-6': document.getElementById('step-6'),
  'step-7': document.getElementById('step-7'),
  'step-8': document.getElementById('step-8'),
  'step-9': document.getElementById('step-9')

};

  let stepHistory = ['step-1'];

  function showStep(id, { push = true } = {}) {
    const current = stepHistory[stepHistory.length - 1];
    if (stepEls[current]) stepEls[current].classList.remove('active');
    stepEls[id].classList.add('active');
    if (push) stepHistory.push(id);
  }

  function goBack() {
    if (stepHistory.length <= 1) return;
    stepHistory.pop();
    const previous = stepHistory[stepHistory.length - 1];
    stepEls[previous].classList.add('active');
    // hide everything else that isn't the one we're returning to
    Object.entries(stepEls).forEach(([id, el]) => {
      if (id !== previous) el.classList.remove('active');
    });
  }

  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', goBack);
  });

  // ---------------------------------------------------------------
  // Step 1: postcode
  // ---------------------------------------------------------------
  const postcodeInput = document.getElementById('postcode');
  const postcodeError = document.getElementById('postcode-error');
  const postcodeNext = document.getElementById('postcode-next');

  const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

  function isValidPostcodeFormat(value) {
    return UK_POSTCODE_REGEX.test(value.trim());
  }

  // Checks the postcode against postcodes.io - a free, open API covering
  // every real UK postcode (no API key needed). This confirms the postcode
  // actually exists, not just that it "looks" like one.
  // Docs: https://postcodes.io/docs
  async function isRealUkPostcode(value) {
    try {
      const res = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(value.trim())}/validate`
      );
      const data = await res.json();
      return data.result === true;
    } catch (err) {
      // Network unavailable / API down - fall back to format-only check
      // rather than blocking the user entirely.
      console.warn('postcodes.io check failed, falling back to format check', err);
      return isValidPostcodeFormat(value);
    }
  }

  postcodeInput.addEventListener('input', () => {
    postcodeInput.classList.remove('invalid');
    postcodeError.classList.remove('show');
  });

  postcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      postcodeNext.click();
    }
  });

  postcodeNext.addEventListener('click', async () => {
    const value = postcodeInput.value.trim();

    // Quick format check first - no need to hit the API for obvious junk.
    if (!isValidPostcodeFormat(value)) {
      postcodeInput.classList.add('invalid');
      postcodeError.classList.add('show');
      postcodeError.textContent = 'Please enter a valid UK postcode.';
      postcodeInput.focus();
      return;
    }

    const originalLabel = postcodeNext.innerHTML;
    postcodeNext.disabled = true;
    postcodeNext.innerHTML = 'Checking…';

    const isReal = await isRealUkPostcode(value);

    if (!isReal) {
      postcodeInput.classList.add('invalid');
      postcodeError.textContent = "We couldn't find that postcode. Please check and try again.";
      postcodeError.classList.add('show');
      postcodeNext.disabled = false;
      postcodeNext.innerHTML = originalLabel;
      postcodeInput.focus();
      return;
    }

    postcodeInput.classList.remove('invalid');
    postcodeError.classList.remove('show');

    // Address-level lookup (house numbers/streets) needs a paid provider
    // such as getAddress.io or Ideal Postcodes - postcodes.io only confirms
    // the postcode itself is real. See lookupAddressesForPostcode() above.
    const addresses = await lookupAddressesForPostcode(value);

    postcodeNext.disabled = false;
    postcodeNext.innerHTML = originalLabel;

    if (addresses.length > 0) {
      setupAddressList(addresses);
      showStep('step-2a');
    } else {
      showStep('step-2b');
      document.getElementById('manual-address').focus();
    }
  });

  // ---------------------------------------------------------------
  // Step 2a: address autocomplete
  // ---------------------------------------------------------------
  const addressInput = document.getElementById('address-search');
  const addressListbox = document.getElementById('address-listbox');
  const addressError = document.getElementById('address-error');
  const addressNext = document.getElementById('address-next');

  let currentAddresses = [];
  let selectedAddress = null;
  let highlightedIndex = -1;

  function setupAddressList(addresses) {
    currentAddresses = addresses;
    selectedAddress = null;
    addressInput.value = '';
    addressNext.disabled = true;
    addressError.classList.remove('show');
    renderSuggestions(addresses);
    setTimeout(() => addressInput.focus(), 50);
  }

  function renderSuggestions(list) {
    highlightedIndex = -1;
    addressListbox.innerHTML = '';

    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No matching addresses found.';
      addressListbox.appendChild(li);
      addressListbox.classList.add('show');
      addressInput.setAttribute('aria-expanded', 'true');
      return;
    }

    list.forEach((addr, i) => {
      const li = document.createElement('li');
      li.textContent = addr;
      li.setAttribute('role', 'option');
      li.dataset.index = i;
      li.addEventListener('click', () => selectAddress(addr));
      addressListbox.appendChild(li);
    });

    addressListbox.classList.add('show');
    addressInput.setAttribute('aria-expanded', 'true');
  }

  function hideSuggestions() {
    addressListbox.classList.remove('show');
    addressInput.setAttribute('aria-expanded', 'false');
  }

  function selectAddress(addr) {
    selectedAddress = addr;
    addressInput.value = addr;
    hideSuggestions();
    addressNext.disabled = false;
    addressError.classList.remove('show');
  }

  addressInput.addEventListener('focus', () => {
    renderSuggestions(filterAddresses(addressInput.value));
  });

  addressInput.addEventListener('input', () => {
    selectedAddress = null;
    addressNext.disabled = true;
    renderSuggestions(filterAddresses(addressInput.value));
  });

  function filterAddresses(query) {
    const q = query.trim().toLowerCase();
    if (!q) return currentAddresses;
    return currentAddresses.filter((a) => a.toLowerCase().includes(q));
  }

  addressInput.addEventListener('keydown', (e) => {
    const items = addressListbox.querySelectorAll('li[role="option"]');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      highlightedIndex = (highlightedIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        selectAddress(items[highlightedIndex].textContent);
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  function updateHighlight(items) {
    items.forEach((el) => el.classList.remove('highlighted'));
    if (items[highlightedIndex]) {
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // click outside closes the dropdown
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete')) hideSuggestions();
  });

  addressNext.addEventListener('click', () => {
    if (!selectedAddress) {
      addressError.classList.add('show');
      return;
    }
    addressError.classList.remove('show');
    showStep('step-3');
  });

  // ---------------------------------------------------------------
  // Step 2b: manual address entry
  // ---------------------------------------------------------------
  const manualInput = document.getElementById('manual-address');
  const manualError = document.getElementById('manual-error');
  const manualNext = document.getElementById('manual-next');

  manualInput.addEventListener('input', () => {
    manualInput.classList.remove('invalid');
    manualError.classList.remove('show');
  });

  manualInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      manualNext.click();
    }
  });

  manualNext.addEventListener('click', () => {
    if (!manualInput.value.trim()) {
      manualInput.classList.add('invalid');
      manualError.classList.add('show');
      manualInput.focus();
      return;
    }
    manualInput.classList.remove('invalid');
    manualError.classList.remove('show');
    showStep('step-3');
  });

  // ---------------------------------------------------------------
  // Step 3: property type (single-select)
  // ---------------------------------------------------------------
  const propertyTypeInputs = document.querySelectorAll('input[name="property-type"]');
  const propertyTypeNext = document.getElementById('property-type-next');

  propertyTypeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      propertyTypeNext.disabled = false;
    });
  });

  propertyTypeNext.addEventListener('click', () => {
    const selected = document.querySelector('input[name="property-type"]:checked');
    if (!selected) return;
    // selected.value holds the chosen property type, e.g. 'Bungalow'
    showStep('step-4');
  });

  // ---------------------------------------------------------------
  // Step 4: home improvements (multi-select checkboxes)
  //
  // User is allowed to tap/touch as many bubbles as apply.
  // "No improvements" and "Not sure" are mutually exclusive with
  // every other option (and with each other), same as most real
  // eligibility forms - selecting one of them clears the rest.
  // ---------------------------------------------------------------
  const improvementInputs = document.querySelectorAll('input[name="improvements"]');
  const improvementsNext = document.getElementById('improvements-next');
  const improvementsError = document.getElementById('improvements-error');
  const exclusiveIds = ['improvement-none', 'improvement-not-sure'];

  function updateImprovementsNextState() {
    const anyChecked = Array.from(improvementInputs).some((el) => el.checked);
    improvementsNext.disabled = !anyChecked;
    if (anyChecked) improvementsError.classList.remove('show');
  }

  improvementInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (exclusiveIds.includes(input.id) && input.checked) {
        // Selecting "No improvements" / "Not sure" clears every other box
        improvementInputs.forEach((other) => {
          if (other !== input) other.checked = false;
        });
      } else if (input.checked) {
        // Selecting any real improvement clears the exclusive options
        exclusiveIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.checked = false;
        });
      }
      updateImprovementsNextState();
    });
  });

  improvementsNext.addEventListener('click', () => {
    const selected = Array.from(improvementInputs)
      .filter((el) => el.checked)
      .map((el) => el.value);

    if (selected.length === 0) {
      improvementsError.classList.add('show');
      return;
    }
    improvementsError.classList.remove('show');
    // `selected` holds every chosen improvement, e.g.
    // ['Loft Insulation', 'Double Glazing', 'Solar Panels']
    showStep('step-5');
  });

  // ---------------------------------------------------------------
  // Step 5: homeowner or renter (single-select)
  // ---------------------------------------------------------------
  const occupancyInputs = document.querySelectorAll('input[name="occupancy"]');
  const occupancyNext = document.getElementById('occupancy-next');

  occupancyInputs.forEach((input) => {
    input.addEventListener('change', () => {
      occupancyNext.disabled = false;
    });
  });

  occupancyNext.addEventListener('click', () => {
    const selected = document.querySelector('input[name="occupancy"]:checked');
    if (!selected) return;
    // selected.value holds 'Homeowner', 'Private Renter', or 'Social Housing'
    showStep('step-5b');
  });

  // ---------------------------------------------------------------
  // Step 5b: gas supply (single-select Yes/No)
  // ---------------------------------------------------------------
  const gasInputs = document.querySelectorAll('input[name="gas-supply"]');
  const gasNext = document.getElementById('gas-next');

  gasInputs.forEach((input) => {
    input.addEventListener('change', () => {
      gasNext.disabled = false;
    });
  });

  gasNext.addEventListener('click', () => {
    const selected = document.querySelector('input[name="gas-supply"]:checked');
    if (!selected) return;
    // selected.value holds 'Yes' (on-gas) or 'No' (off-gas)
    showStep('step-5c');
  });

  // ---------------------------------------------------------------
  // Step 5c: benefits (click-to-select bubbles, single-select)
  //
  // Same bubble-style radio group as the other steps - no dropdown,
  // so the user can just tap the option that applies to them.
  // ---------------------------------------------------------------
  const benefitsInputs = document.querySelectorAll('input[name="benefits"]');
  const benefitsNext = document.getElementById('benefits-next');

  benefitsInputs.forEach((input) => {
    input.addEventListener('change', () => {
      benefitsNext.disabled = false;
    });
  });

  benefitsNext.addEventListener('click', () => {
    const selected = document.querySelector('input[name="benefits"]:checked');
    if (!selected) return;
    // selected.value holds the chosen benefit, e.g. 'Universal Credit (UC)'
    showStep('step-6');
  });

  
//debts 

// --------------------
// Step 6 - Debt
// --------------------

const debtInputs = document.querySelectorAll('input[name="debt"]');
const debtNext = document.getElementById("debt-next");

debtInputs.forEach((input) => {

    input.addEventListener("change", () => {
        debtNext.disabled = false;
    });

});

debtNext.addEventListener("click", () => {

    const selectedDebt = document.querySelector('input[name="debt"]:checked');

    if (!selectedDebt) return;

    showStep("step-7");

});

const title=document.getElementById("title");
const first=document.getElementById("firstname");
const last=document.getElementById("lastname");
const phone=document.getElementById("phone");
const email=document.getElementById("email");

const contactNext=document.getElementById("contact-next");

function checkForm(){

const validPhone=/^[0-9]{10,15}$/.test(phone.value.trim());

const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

contactNext.disabled=!(

title.value &&
first.value.trim() &&
last.value.trim() &&
validPhone &&
validEmail

);

}

title.addEventListener("change",checkForm);
first.addEventListener("input",checkForm);
last.addEventListener("input",checkForm);
phone.addEventListener("input",checkForm);
email.addEventListener("input",checkForm);

contactNext.addEventListener("click",()=>{

showStep("step-9");

});
// STEP 9

const callTime = document.getElementById("call-time");
const gift = document.getElementById("gift");
const privacy = document.getElementById("privacy-check");
const submitBtn = document.getElementById("submit-btn");

function checkStep9() {

    if (
        callTime.value.trim() !== "" &&
        gift.value !== "" &&
        privacy.checked
    ) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }

}

callTime.addEventListener("input", checkStep9);
gift.addEventListener("change", checkStep9);
privacy.addEventListener("change", checkStep9);

submitBtn.addEventListener("click", () => {

    window.location.href = "thankyou.html";

});

    // yaha API call ya form submit kar sakte ho





});