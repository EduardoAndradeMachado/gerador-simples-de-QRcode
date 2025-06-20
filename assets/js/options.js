document.addEventListener('DOMContentLoaded', () => {
    // Selecionou uma das opcoes
    const opcoes = document.querySelectorAll('input[name="qrType"]')
    opcoes.forEach(opcao => {
        opcao.addEventListener("change", () => {
            const selecionado = document.querySelector('input[name="qrType"]:checked')
            exibirInput(selecionado.id)
        })
    });

    function exibirInput(inputId) {
        const idBloco = "block-" + inputId.replace("type-", "");

        const blocos = document.querySelectorAll("#qr-options-input > div");
        blocos.forEach(bloco => {
            if (bloco.id === idBloco) {
                bloco.classList.remove("hidden")
            } else {
                bloco.classList.add("hidden")
            }
        });
    }

    // Clicou no botão gerar
    const botaoGerarQRcode = document.querySelector("#gerar-QRcode")
    botaoGerarQRcode.addEventListener("click", (e) => {
        const selecionado = document.querySelector('input[name="qrType"]:checked')
        if (selecionado) {
            if (validarInput(selecionado.id))
                gerarQRcode()
        } else {
            alert("Nenhum item foi selecionado")
        }
    })

    // Validar input
    function validarInput(inputId) {
        switch (inputId) {
            case 'type-url':
                return validaUrl()

            case 'type-wpp':
                return validaWpp()

            case 'type-telefone':
                return validaTelefone()

            case 'type-pix':
                return validaPix()

            default:
                alert("Erro na validação")
                return false
        }
    }

    function validaUrl() {
        const inputEl = document.querySelector("#block-url input");
        let inputValue = inputEl.value.trim();

        // Se não começa com http:// ou https://, adiciona https://
        if (!/^https?:\/\//i.test(inputValue)) {
            inputValue = "https://" + inputValue;
            inputEl.value = inputValue;
        }

        // Validação simples após garantir protocolo
        if (inputValue && /^https?:\/\/[^\s]+\.[^\s]+$/.test(inputValue)) {
            return true;
        } else {
            alert("URL inválida");
            return false;
        }
    }

    function validaNumeroTelefone(telefone) {
        // remove tudo que não for número
        telefone = telefone.replace(/\D/g, '');
        // Se não começa com "55", adiciona
        if (!telefone.startsWith("55")) {
            telefone = "55" + telefone;
        }

        // Regex: começa com 55, depois 2 dígitos de DDD, depois 8 ou 9 dígitos de número
        if (/^55\d{10,11}$/.test(telefone)) {
            return telefone; // retorna string formatada
        } else {
            return false;
        }
    }

    function validaWpp() {
        const inputEl = document.querySelector("#block-wpp input");
        let telefone = validaNumeroTelefone(inputEl.value);
        if (telefone) {
            inputEl.value = telefone;
            return true
        } else {
            alert("Número de Whatsapp inválido. Use DDD + número, com 8 ou 9 dígitos.");
            return false
        }
    }

    function validaTelefone() {
        const inputEl = document.querySelector("#block-telefone input");
        let telefone = validaNumeroTelefone(inputEl.value);
        if (telefone) {
            inputEl.value = telefone;
            return true
        } else {
            alert("Número de telefone inválido. Use DDD + número, com 8 ou 9 dígitos.");
            return false
        }
    }

    function validaPix() {
        const block = document.querySelector("#block-pix");
        const chave = block.querySelector('input[name="pixKey"]').value.trim();
        const nome = block.querySelector('input[name="receiverName"]').value.trim();
        const cidade = block.querySelector('input[name="receiverCity"]').value.trim();
        const valor = block.querySelector('input[name="amount"]').value.trim();

        if (!chave) {
            alert("Informe a chave PIX.");
            return false;
        }
        if (!nome) {
            alert("Informe o nome do recebedor.");
            return false;
        }
        if (!cidade) {
            alert("Informe a cidade do recebedor.");
            return false;
        }

        // Se o valor foi preenchido, deve ser um número positivo
        if (valor) {
            const valorNum = Number(valor.replace(',', '.'));
            if (isNaN(valorNum) || valorNum <= 0) {
                alert("O valor deve ser um número positivo.");
                return false;
            }
        }

        // Validação simples da chave Pix (pode ser email, telefone, CPF/CNPJ ou chave aleatória)
        const chaveValida =
            /^[0-9]{11}$/.test(chave) || // telefone
            /^[0-9]{14}$/.test(chave) || // CNPJ
            /^[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}$/.test(chave) || // CPF com pontos e traço
            /^[a-zA-Z0-9.\-_@]+$/.test(chave); // email ou chave aleatória

        if (!chaveValida) {
            alert("Chave PIX inválida.");
            return false;
        }

        return true;
    }

    function gerarQRcode() {
        const selecionado = document.querySelector('input[name="qrType"]:checked');
        if (!selecionado) {
            return false
        };

        let texto;

        switch (selecionado.id) {
            case 'type-url':
                texto = document.querySelector("#block-url input").value;
                break;

            case 'type-wpp':
                const wppNum = document.querySelector("#block-wpp input").value;
                texto = "https://wa.me/" + wppNum;
                break;

            case 'type-telefone':
                texto = "tel:" + document.querySelector("#block-telefone input").value;
                break;

            case 'type-pix':
                // Pega os valores do formulário PIX
                const block = document.querySelector("#block-pix");
                const chave = block.querySelector('input[name="pixKey"]').value.trim();
                const nome = block.querySelector('input[name="receiverName"]').value.trim();
                const cidade = block.querySelector('input[name="receiverCity"]').value.trim();
                const valor = block.querySelector('input[name="amount"]').value.trim();

                texto = gerarPayloadPix(chave, nome, cidade, valor);
                break;
        }

        // Limpar QR code anterior, se houver
        const container = document.getElementById("qrcode");
        container.innerHTML = "";

        // Gerar novo QR code
        new QRCode(container, {
            text: texto,
            width: 750,
            height: 750,
        });
    }

    // Função para gerar o payload PIX
    function gerarPayloadPix(pixKey, receiverName, receiverCity, amount = '') {
        function safeTruncate(str, maxLength) {
            let result = '';
            let length = 0;
            for (const char of str) {
                length += (char.codePointAt(0) > 0x7f) ? 2 : 1;
                if (length >= maxLength) break;
                result += char;
            }
            return result;
        }

        function tlv(id, value) {
            const len = value.length.toString().padStart(2, '0');
            return id + len + value;
        }

        function crc16(str) {
            let crc = 0xFFFF;
            for (let i = 0; i < str.length; i++) {
                crc ^= str.charCodeAt(i) << 8;
                for (let j = 0; j < 8; j++) {
                    if ((crc & 0x8000) !== 0) {
                        crc = (crc << 1) ^ 0x1021;
                    } else {
                        crc <<= 1;
                    }
                    crc &= 0xFFFF;
                }
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        }

        const nomeFormatado = safeTruncate(removerAcentos(receiverName.trim().toUpperCase()), 25);
        const cidadeFormatada = safeTruncate(removerAcentos(receiverCity.trim().toUpperCase()), 15);
        const chaveFormatada = pixKey.trim();

        let valorFormatado = '';
        if (amount) {
            let num = Number(amount.toString().replace(',', '.'));
            if (!isNaN(num) && num > 0) {
                valorFormatado = num.toFixed(2);
            }
        }

        let payload = '';
        payload += tlv('00', '01');
        payload += tlv('26',
            tlv('00', 'BR.GOV.BCB.PIX') +
            tlv('01', chaveFormatada)
        );
        payload += tlv('52', '0000');
        payload += tlv('53', '986');
        if (valorFormatado) payload += tlv('54', valorFormatado);
        payload += tlv('58', 'BR');
        payload += tlv('59', nomeFormatado);
        payload += tlv('60', cidadeFormatada);
        payload += tlv('62', tlv('05', '***')); // txid fixo
        payload += '6304';
        const crc = crc16(payload);
        payload += crc;
        return payload;
    }

    function removerAcentos(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

});