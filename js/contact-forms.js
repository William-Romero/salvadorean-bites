(() => {
    'use strict';

    const form = document.getElementById('contact-form');
    if (!form) return;

    const btn = document.getElementById('submit');
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const subjectEl = document.getElementById('subject');
    const messageEl = document.getElementById('message');

    // Crea elemento de estado para mensajes de éxito/error
    const statusEl = document.createElement('div');
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    statusEl.style.marginTop = '12px';
    statusEl.style.fontSize = '0.95rem';
    form.appendChild(statusEl);

    const validators = {
        name: v => typeof v === 'string' && v.trim().length >= 2,
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        phone: v => {
            const cleaned = v.replace(/[\s\-()]/g, '');
            return /^\+?\d{7,15}$/.test(cleaned);
        },
        subject: v => v && v.trim().length > 0,
        message: v => typeof v === 'string' && v.trim().length >= 10
    };

    function clearStatus() {
        statusEl.textContent = '';
        statusEl.style.color = '';
    }

    function showStatus(type, text) {
        statusEl.textContent = text;
        statusEl.style.color = type === 'success' ? 'green' : 'crimson';
    }

    function fieldError(el, msg) {
        el.setAttribute('aria-invalid', 'true');
        // Ccrea o actualiza el hint de error
        let hint = el.nextElementSibling;
        if (!hint || !hint.classList || !hint.classList.contains('field-hint')) {
            hint = document.createElement('div');
            hint.className = 'field-hint';
            hint.style.color = 'crimson';
            hint.style.fontSize = '0.85rem';
            hint.style.marginTop = '4px';
            el.parentNode.insertBefore(hint, el.nextSibling);
        }
        hint.textContent = msg;
    }

    function clearFieldError(el) {
        el.removeAttribute('aria-invalid');
        const hint = el.nextElementSibling;
        if (hint && hint.classList && hint.classList.contains('field-hint')) {
            hint.parentNode.removeChild(hint);
        }
    }

    function validateAll() {
        clearStatus();
        let firstInvalid = null;

        const values = {
            name: nameEl.value,
            email: emailEl.value,
            phone: phoneEl.value,
            subject: subjectEl.value,
            message: messageEl.value
        };

        // Nombre 
        if (!validators.name(values.name)) {
            fieldError(nameEl, 'Ingrese un nombre válido (mínimo 2 caracteres).');
            firstInvalid = firstInvalid || nameEl;
        } else {
            clearFieldError(nameEl);
        }

        // Correo Electrónico
        if (!validators.email(values.email)) {
            fieldError(emailEl, 'Ingrese un correo electrónico válido.');
            firstInvalid = firstInvalid || emailEl;
        } else {
            clearFieldError(emailEl);
        }

        // Número de Teléfono
        if (!validators.phone(values.phone)) {
            fieldError(phoneEl, 'Ingrese un número válido (ej: +503 7000-0000).');
            firstInvalid = firstInvalid || phoneEl;
        } else {
            clearFieldError(phoneEl);
        }

        // Asunto
        if (!validators.subject(values.subject)) {
            fieldError(subjectEl, 'Seleccione un asunto.');
            firstInvalid = firstInvalid || subjectEl;
        } else {
            clearFieldError(subjectEl);
        }

        // Mensaje
        if (!validators.message(values.message)) {
            fieldError(messageEl, 'El mensaje debe tener al menos 10 caracteres.');
            firstInvalid = firstInvalid || messageEl;
        } else {
            clearFieldError(messageEl);
        }

        return { valid: !firstInvalid, firstInvalid };
    }

    async function submitForm(e) {
        e.preventDefault();
        clearStatus();

        const { valid, firstInvalid } = validateAll();
        if (!valid) {
            showStatus('error', 'Por favor corrige los campos en rojo.');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        // Prepare para enviar
        btn.disabled = true;
        const originalLabel = btn.textContent;
        btn.textContent = 'Enviando...';

        try {
            const fd = new FormData(form);
            const res = await fetch(form.action, {
                method: form.method || 'POST',
                body: fd,
                headers: {
                    Accept: 'application/json'
                }
            });

            if (res.ok) {
                showStatus('success', 'Mensaje enviado correctamente. Gracias.');
                form.reset();
                // Limpiar errores de campos
                [nameEl, emailEl, phoneEl, subjectEl, messageEl].forEach(clearFieldError);
                setTimeout(() => clearStatus(), 5000);
            } else {
                let json;
                try {
                    json = await res.json();
                } catch (err) {
                    // Ignorar error de parseo
                }
                const errMsg = (json && json.error) ? json.error : 'Error al enviar. Intenta nuevamente.';
                showStatus('error', errMsg);
            }
        } catch (err) {
            showStatus('error', 'No se pudo enviar. Verifique su conexión.');
        } finally {
            btn.disabled = false;
            btn.textContent = originalLabel;
        }
    }

    // Eventos para limpiar errores al modificar campos
    [nameEl, emailEl, phoneEl, subjectEl, messageEl].forEach(el => {
        el.addEventListener('input', () => {
            clearFieldError(el);
            clearStatus();
        });
        el.addEventListener('change', () => {
            clearFieldError(el);
            clearStatus();
        });
    });

    form.addEventListener('submit', submitForm);
})();