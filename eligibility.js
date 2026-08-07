document.addEventListener('DOMContentLoaded', () => {

 
  const SUBMIT_ENDPOINT = 'http://localhost:5000/api/users/submit';

  function normalizePostcode(value) {
    return value.trim().toUpperCase().replace(/\s+/g, '');
  }

  const GETADDRESS_API_KEY = 'YOUR_API_KEY_HERE';

  const MOCK_ADDRESS_DB = {
    'L18JQ': [
      '1 Castle Chambers, China Street',
      '1 China Street',
      '2 Castle Chambers, China Street',
      '3 Castle Chambers, China Street',
      '14a China Street',
    ],
    'M11AE': [
      '1 Piccadilly Gardens',
      '2 Piccadilly Gardens',
      'Flat 3, Piccadilly Gardens',
      '10 Market Street',
    ],
    'SW1A1AA': ['Buckingham Palace'],
    'SW1A2AA': [
      '10 Downing Street',
      '11 Downing Street',
      '12 Downing Street',
    ],
    'B11AA': [
      '1 New Street',
      '3 New Street',
      'Flat 2, 5 New Street',
      '22 Corporation Street',
    ],
    'LS11AA': [
      '4 Boar Lane',
      '6 Boar Lane',
      '15 Park Row',
      'Suite 2, 15 Park Row',
    ],
    'EH11AA': [
      '1 Princes Street',
      '5 Princes Street',
      '18 George Street',
    ],
    'G11AA': [
      '2 Sauchiehall Street',
      '9 Sauchiehall Street',
      '21 Buchanan Street',
    ],
    'BS11AA': [
      '3 Corn Street',
      '7 Corn Street',
      '12 Park Street',
    ],
    'S11AA': [
      '5 Fargate',
      '11 Fargate',
      '2 Division Street',
    ],
    'CF101AA': [
      '1 Queen Street',
      '4 Queen Street',
      '9 St Mary Street',
    ],
    'BT11AA': [
      '2 Donegall Square',
      '6 Donegall Square',
      '14 Royal Avenue',
    ],
    'NE11AA': [
      '3 Grey Street',
      '8 Grey Street',
      '20 Northumberland Street',
    ],
    'NG11AA': [
      '1 Old Market Square',
      '5 Old Market Square',
      '17 Clumber Street',
    ],
    'OX11AA': [
      '2 High Street',
      '6 High Street',
      '11 Cornmarket Street',
    ],
    'CB11AA': [
      '3 Market Street',
      '7 Market Street',
      '15 Bridge Street',
    ],
    'SO141AA': [
      '1 Above Bar Street',
      '4 Above Bar Street',
      '9 High Street',
    ],
    'BN11AA': [
      '2 North Street',
      '5 North Street',
      '18 Western Road',
    ],
    'YO11AA': [
      '3 Coney Street',
      '7 Coney Street',
      '12 Stonegate',
    ],
    'NR11AA': [
      '1 London Street',
      '4 London Street',
      '9 Castle Street',
    ],
    'PL11AA': [
      '2 Royal Parade',
      '6 Royal Parade',
      '13 Armada Way',
    ],
  };

  async function lookupAddressesForPostcode(rawPostcode) {
    const postcode = rawPostcode.trim();

    if (GETADDRESS_API_KEY === 'YOUR_API_KEY_HERE') {
      const key = normalizePostcode(postcode);
      return MOCK_ADDRESS_DB[key] || [];
    }

    try {
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

 
  const stepEls = {
    'step-1': document.getElementById('step-1'),
    'step-2a': document.getElementById('step-2a'),
    'step-2b': document.getElementById('step-2b'),
    'step-3': document.getElementById('step-3'),
    'step-4': document.getElementById('step-4'),
    'step-5': document.getElementById('step-5'),
    'step-social': document.getElementById('step-social'),
    'step-5b': document.getElementById('step-5b'),
    'step-5c': document.getElementById('step-5c'),
    'step-6': document.getElementById('step-6'),
    'step-6b': document.getElementById('step-6b'),
    'step-7': document.getElementById('step-7'),
    'step-9': document.getElementById('step-9')
  };

  let stepHistory = ['step-1'];

  function showStep(id, { push = true } = {}) {
    const current = stepHistory[stepHistory.length - 1];
    if (stepEls[current]) stepEls[current].classList.remove('active');
    if (!stepEls[id]) {
      console.warn(`showStep: no element registered for "${id}"`);
      return;
    }
    stepEls[id].classList.add('active');
    if (push) stepHistory.push(id);
  }

  function goBack() {
    if (stepHistory.length <= 1) return;
    stepHistory.pop();
    const previous = stepHistory[stepHistory.length - 1];
    stepEls[previous].classList.add('active');
    Object.entries(stepEls).forEach(([id, el]) => {
      if (id !== previous) el.classList.remove('active');
    });
  }

  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', goBack);
  });


  const postcodeInput = document.getElementById('postcode');
  const postcodeError = document.getElementById('postcode-error');
  const postcodeNext = document.getElementById('postcode-next');

  const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

  function isValidPostcodeFormat(value) {
    return UK_POSTCODE_REGEX.test(value.trim());
  }

  async function isRealUkPostcode(value) {
    try {
      const res = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(value.trim())}/validate`
      );
      const data = await res.json();
      return data.result === true;
    } catch (err) {
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

    if (!isValidPostcodeFormat(value)) {
      postcodeInput.classList.add('invalid');
      postcodeError.classList.add('show');
      postcodeError.textContent = 'Please enter a valid UK postcode.';
      postcodeInput.focus();
      return;
    }

    const originalLabel = postcodeNext.innerHTML;
    postcodeNext.disabled = true;
    postcodeNext.innerHTML = 'Checking...';

    const isReal = await isRealUkPostcode(value);

    postcodeNext.disabled = false;
    postcodeNext.innerHTML = originalLabel;

    if (!isReal) {
      postcodeInput.classList.add('invalid');
      postcodeError.classList.add('show');
      postcodeError.textContent =
        "We couldn't find that postcode. Please check and try again.";
      postcodeInput.focus();
      return;
    }

    postcodeInput.classList.remove('invalid');
    postcodeError.classList.remove('show');

    // Directly go to Manual Address step
    showStep('step-2b');
    manualInput.focus();

  });


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
    showStep('step-4');
  });

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
        improvementInputs.forEach((other) => {
          if (other !== input) other.checked = false;
        });
      } else if (input.checked) {
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
    showStep('step-5');
  });

 
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

    if (
      selected.value === 'Homeowner' ||
      selected.value === 'Private Renter'
    ) {
      showStep('step-5b');
    }

    
    else if (selected.value === 'Social Housing') {
      showStep('step-social');
    }

  });

 
  const propertyIssueInputs = document.querySelectorAll('input[name="property-issue"]');
  const socialNext = document.getElementById('social-next');
  const socialError = document.getElementById('social-error');

  propertyIssueInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const anyChecked = Array.from(propertyIssueInputs).some((el) => el.checked);
      socialNext.disabled = !anyChecked;
      if (anyChecked) socialError.classList.remove('show');
    });
  });

  socialNext.addEventListener('click', () => {
    const selected = Array.from(propertyIssueInputs)
      .filter((el) => el.checked)
      .map((el) => el.value);

    if (selected.length === 0) {
      socialError.classList.add('show');
      return;
    }
    socialError.classList.remove('show');
    showStep('step-5c');
  });

  
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
    showStep('step-5c');
  });

  
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
    showStep('step-6');
  });

  
  const debtInputs = document.querySelectorAll('input[name="debt"]');
  const debtNext = document.getElementById('debt-next');
  const debtError = document.getElementById('debt-error');
  const debtExclusiveIds = ['debt-none'];

  function updateDebtNextState() {
    const anyChecked = Array.from(debtInputs).some((el) => el.checked);
    debtNext.disabled = !anyChecked;
    if (anyChecked) debtError.classList.remove('show');
  }

  debtInputs.forEach((input) => {

    input.addEventListener('change', () => {
      if (debtExclusiveIds.includes(input.id) && input.checked) {
        debtInputs.forEach((other) => {
          if (other !== input) other.checked = false;
        });
      } else if (input.checked) {
        debtExclusiveIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.checked = false;
        });
      }
      updateDebtNextState();
    });

  });

  debtNext.addEventListener('click', () => {

    const selectedDebts = Array.from(debtInputs)
      .filter((el) => el.checked)
      .map((el) => el.value);

    if (selectedDebts.length === 0) {
      debtError.classList.add('show');
      return;
    }

    debtError.classList.remove('show');

    const onlyNoneSelected = selectedDebts.length === 1 && selectedDebts[0] === 'None';

    if (onlyNoneSelected) {
      
      debtAmountInputs.forEach((el) => { el.checked = false; });
      debtAmountNext.disabled = true;
    }

    showStep(onlyNoneSelected ? 'step-7' : 'step-6b');

  });

 
  const debtAmountInputs = document.querySelectorAll('input[name="debt-amount"]');
  const debtAmountNext = document.getElementById('debt-amount-next');

  debtAmountInputs.forEach((input) => {
    input.addEventListener('change', () => {
      debtAmountNext.disabled = false;
    });
  });

  debtAmountNext.addEventListener('click', () => {
    const selected = document.querySelector('input[name="debt-amount"]:checked');
    if (!selected) return;
    showStep('step-7');
  });

  const title = document.getElementById('title');
  const first = document.getElementById('firstname');
  const last = document.getElementById('lastname');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');

  const contactNext = document.getElementById('contact-next');

  function checkForm() {

    const validPhone = /^[0-9]{10,15}$/.test(phone.value.trim());
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

    contactNext.disabled = !(
      title.value &&
      first.value.trim() &&
      last.value.trim() &&
      validPhone &&
      validEmail
    );

  }

  title.addEventListener('change', checkForm);
  first.addEventListener('input', checkForm);
  last.addEventListener('input', checkForm);
  phone.addEventListener('input', checkForm);
  email.addEventListener('input', checkForm);

  contactNext.addEventListener('click', () => {
    showStep('step-9');
  });


  const callTime = document.getElementById('call-time');
  const gift = document.getElementById('gift');
  const privacy = document.getElementById('privacy-check');
  const submitBtn = document.getElementById('submit-btn');

  function checkStep9() {
    submitBtn.disabled = !(
      callTime.value.trim() !== '' &&
      gift.value !== '' &&
      privacy.checked
    );
  }

  
  callTime.addEventListener('input', checkStep9);
  gift.addEventListener('change', checkStep9);
  privacy.addEventListener('change', checkStep9);

  submitBtn.addEventListener('click', async () => {

    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    const selectedDebtValues = Array.from(
      document.querySelectorAll('input[name="debt"]:checked')
    ).map((el) => el.value);

    const hasRealDebt = selectedDebtValues.length > 0 && !(
      selectedDebtValues.length === 1 && selectedDebtValues[0] === 'None'
    );

    const formData = {
      postcode: postcodeInput.value,
      address: selectedAddress || manualInput.value,

      propertyType: document.querySelector('input[name="property-type"]:checked')?.value,

      improvements: Array.from(
        document.querySelectorAll('input[name="improvements"]:checked')
      ).map((el) => el.value),

      ownership: document.querySelector('input[name="occupancy"]:checked')?.value,

      gasSupply: document.querySelector('input[name="gas-supply"]:checked')?.value,

      propertyIssues: Array.from(
        document.querySelectorAll('input[name="property-issue"]:checked')
      ).map((el) => el.value),

      benefits: document.querySelector('input[name="benefits"]:checked')?.value,

      debt: selectedDebtValues,

  
      debtAmount: hasRealDebt
        ? (document.querySelector('input[name="debt-amount"]:checked')?.value || null)
        : null,

      title: title.value,
      firstName: first.value,
      lastName: last.value,
      phone: phone.value,
      email: email.value,

      callTime: callTime.value,
      gift: gift.value,
      privacyAccepted: privacy.checked
    };

    try {

      const response = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      window.location.href = 'thankyou.html';

    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      alert('Something went wrong saving your details. Please try again.');
    }

  });

});
