$(document).ready(function () {
    catalogo.eventos.init();
})

var catalogo = {};

var MEU_CARRINHO = [];

var VALOR_CARRINHO = 0;

var VALOR_ENTREGA = 7.5;

var MEU_ENDERECO = null;

var CELULAR_CUPLY = '5511977825027';

catalogo.eventos = {
    
    init: () => {
        catalogo.metodos.obterItensCatalogo();
        catalogo.metodos.abrirModalImagem();
        catalogo.metodos.carregarBtnReserva();
        catalogo.metodos.carregarBtnLigar();
    }

}

catalogo.metodos = {

    //obtem a lista de itens do catálogo
   obterItensCatalogo: (categoria = 'amor', vermais = false) => {
    
        var filtro = MENU[categoria];
        
        if (!vermais) {
            $("#itemCatalogo").html('')
            $("#btnVerMais").removeClass('hidden');
        }

        $.each(filtro, (i, e) => {

            let temp = catalogo.templates.item
            .replace(/\${img}/g, e.img)
            .replace(/\${id}/g, e.id)
            .replace(/\${name}/g, e.name)
            .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))


            // botão ver mais for clicado (12 itens)
            if (vermais && i >= 8 && i < 12) {
                $("#itemCatalogo").append(temp)
            }

            // paginação inicial (8 itens)
            if (!vermais && i < 8) {
                $("#itemCatalogo").append(temp)
            }
            

        })

        //remove o ativo
        $(".container-menu a").removeClass('active');

        //seta o menu para ativo
        $("#menu-" + categoria).addClass('active');

    },

    // clique no botão de ver mais
    verMais: () => {

        var ativo = $(".container-menu a.active").attr('id').split('menu-')[1]; //menu-amor
        catalogo.metodos.obterItensCatalogo(ativo, true)

        $("#btnVerMais").addClass('hidden');

    },

    abrirModalImagem: () => {

        var imagensProdutoAtual = [];
        var indexImagemAtual = 0;
        var touchInicioX = 0;
        var touchFimX = 0;

        function trocarImagem(novoIndex) {

            if (novoIndex < 0) {
                novoIndex = imagensProdutoAtual.length - 1;
            }

            if (novoIndex >= imagensProdutoAtual.length) {
                novoIndex = 0;
            }

            indexImagemAtual = novoIndex;

            $("#imgExpandida").addClass("fade");

            setTimeout(function () {
                $("#imgExpandida").attr("src", imagensProdutoAtual[indexImagemAtual]);
                $("#imgExpandida").removeClass("fade");

                $(".miniatura-img").removeClass("active");
                $(".miniatura-img").eq(indexImagemAtual).addClass("active");
            }, 200);
        }

        $(document).on("click", ".abrir-imagem", function () {

            var idProduto = $(this).data("id");
            var produtoEncontrado = null;

            $.each(MENU, function (categoria, produtos) {
                $.each(produtos, function (i, produto) {
                    if (produto.id === idProduto) {
                        produtoEncontrado = produto;
                    }
                });
            });

            if (produtoEncontrado == null) return;

            imagensProdutoAtual = produtoEncontrado.imgs || [produtoEncontrado.img];
            indexImagemAtual = 0;

            // MOSTRA OU ESCONDE SETAS E MINIATURAS

            if (imagensProdutoAtual.length <= 1) {
                $(".seta-modal").hide();
                $("#miniaturasProduto").hide();
            } else {
                $(".seta-modal").show();
                $("#miniaturasProduto").show();
            }

            // CONTROLA O ZOOM

            if (imagensProdutoAtual.length <= 1) {
                $("#imgExpandida").addClass("sem-zoom");
            } else {
                $("#imgExpandida").removeClass("sem-zoom");
            }

            $("#tituloProdutoModal").text(produtoEncontrado.name);
            $("#descricaoProdutoModal").text(produtoEncontrado.dsc);

            $("#miniaturasProduto").html("");

            $.each(imagensProdutoAtual, function (i, img) {
                $("#miniaturasProduto").append(`
                    <img src="${img}" class="miniatura-img ${i === 0 ? 'active' : ''}" data-index="${i}">
                `);
            });

            trocarImagem(0);

            $("#modalImagem").fadeIn();
        });

        $(document).on("click", ".miniatura-img", function () {
            var index = $(this).data("index");
            trocarImagem(index);
        });

        $(document).on("click", ".seta-direita", function () {
            trocarImagem(indexImagemAtual + 1);
        });

        $(document).on("click", ".seta-esquerda", function () {
            trocarImagem(indexImagemAtual - 1);
        });

        $("#imgExpandida").on("touchstart", function (e) {
            touchInicioX = e.originalEvent.touches[0].clientX;
        });

        $("#imgExpandida").on("touchend", function (e) {
            touchFimX = e.originalEvent.changedTouches[0].clientX;

            if (touchInicioX - touchFimX > 50) {
                trocarImagem(indexImagemAtual + 1);
            }

            if (touchFimX - touchInicioX > 50) {
                trocarImagem(indexImagemAtual - 1);
            }
        });

        $(".fechar").on("click", function () {
            $("#modalImagem").fadeOut();
        });

        $("#modalImagem").on("click", function (e) {
            if (e.target.id === "modalImagem") {
                $("#modalImagem").fadeOut();
            }
        });

    },


    // diminuir a qtd do item do catálogo
    diminuirQuantidade: (id) => {
        
        let qntdAtual = parseInt($("#qntd-" + id).text());

        if (qntdAtual > 0) {
            $("#qntd-" + id).text(qntdAtual - 1)
        }

    },

    // daumentar a qtd do item do catálogo
    aumentarQuantidade: (id) => {

        let qntdAtual = parseInt($("#qntd-" + id).text());
        $("#qntd-" + id).text(qntdAtual + 1)
    },

    // adicionar ao carrinho o item do catálogo
    adicionarAoCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-" + id).text());

        if (qntdAtual > 0) {

            // obter a categoria ativa
            var categoria = $(".container-menu a.active").attr('id').split('menu-')[1];

            // obter a lista de itens
            let filtro = MENU[categoria];

            // obter o item
            let item = $.grep(filtro, (e, i) => { return e.id == id});

            if (item.length > 0) {

                // validar se já existe esse item no carrinho
                let existe = $.grep(MEU_CARRINHO, (elem, index) => { return elem.id == id});

                // caso exista, só altera a qntd
                if (existe.length > 0) {
                    let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
                    MEU_CARRINHO[objIndex].qntd = MEU_CARRINHO[objIndex].qntd + qntdAtual;
                } else { //caso não exista, add ele
                    item[0].qntd = qntdAtual;
                    MEU_CARRINHO.push(item[0])
                }

                catalogo.metodos.mensagem('Item adicionado ao carrinho', 'green');
                $("#qntd-" + id).text(0);
                
                catalogo.metodos.atualizarBadgeTotal();

            }

        }
    },

    // atualiza o badge de totais dos botões MEU_CARRINHO
    atualizarBadgeTotal: () => {
        var total = 0;

        $.each(MEU_CARRINHO, (i, e) => {
            total += e.qntd
        })

        if (total > 0) {
            $(".botao-carrinho").removeClass('hidden');
            $(".container-total-carrinho").removeClass('hidden');            
        } else {
            $(".botao-carrinho").addClass('hidden')
        }

        $(".badge-total-carrinho").html(total);

    },

    // abrir a modal de carrinho
    abrirCarrinho: (abrir) => {
        if (abrir) {
            $("#modalCarrinho").removeClass('hidden');
            catalogo.metodos.carregarCarrinho();
        } else {
            $("#modalCarrinho").addClass('hidden');
        }
    },

    // altera os textos e exibe os botões das etapas
    carregarEtapa: (etapa) => {
        
        if (etapa == 1) {
            $("#lblTituloEtapa").text('Seu carrinho:');
            $("#itensCarrinho").removeClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');

            $("#btnEtapaPedido").removeClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").addClass('hidden');
        } 
        
        if (etapa == 2) {
            $("#lblTituloEtapa").text('Endereço de entrega:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").removeClass('hidden');
            $("#resumoCarrinho").addClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');
            $(".etapa2").addClass('active');

            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").removeClass('hidden');
            $("#btnEtapaResumo").addClass('hidden');
            $("#btnVoltar").removeClass('hidden');
        } 
        
        if (etapa == 3) {
            $("#lblTituloEtapa").text('Resumo do pedido:');
            $("#itensCarrinho").addClass('hidden');
            $("#localEntrega").addClass('hidden');
            $("#resumoCarrinho").removeClass('hidden');

            $(".etapa").removeClass('active');
            $(".etapa1").addClass('active');
            $(".etapa2").addClass('active');
            $(".etapa3").addClass('active');


            $("#btnEtapaPedido").addClass('hidden');
            $("#btnEtapaEndereco").addClass('hidden');
            $("#btnEtapaResumo").removeClass('hidden');
            $("#btnVoltar").removeClass('hidden');            
        }

    },

    // botao de voltar etapa
    voltarEtapa: () => {

        let etapa = $(".etapa.active").length;
        catalogo.metodos.carregarEtapa(etapa - 1);

    },

    // carrega a lista de itens do carrinho
    carregarCarrinho: () => {

        catalogo.metodos.carregarEtapa(1);

        if (MEU_CARRINHO.length > 0) {

            $("#itensCarrinho").html('');

            $.each(MEU_CARRINHO, (i, e) => {

                let temp = catalogo.templates.itemCarrinho
                .replace(/\${img}/g, e.img)
                .replace(/\${id}/g, e.id)
                .replace(/\${name}/g, e.name)
                .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))
                .replace(/\${qntd}/g, e.qntd)

                $("#itensCarrinho").append(temp);

                // último item 
                if ((i + 1) == MEU_CARRINHO.length) {
                    catalogo.metodos.carregarValores();
                }
                
            })

        } else {
            $("#itensCarrinho").html('<p class="carrinho-vazio"><i class="fa fas fa-cart-plus"></i> Seu carrinho está vazio.</p>');
            catalogo.metodos.carregarValores();
        }
    },

    // diminuir qntd do item no carrinho
    diminuirQuantidadeCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());

        if (qntdAtual > 1) {
            $("#qntd-carrinho-" + id).text(qntdAtual - 1);
            catalogo.metodos.atualizarCarrinho(id, qntdAtual - 1);
        } else {
            catalogo.metodos.removerItemCarrinho(id);
        }

    },

    // aumentar qntd do item no carrinho
    aumentarQuantidadeCarrinho: (id) => {

        let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
        $("#qntd-carrinho-" + id).text(qntdAtual + 1);
        catalogo.metodos.atualizarCarrinho(id, qntdAtual + 1);

    },

    // btn remover item carrinho
    removerItemCarrinho: (id) => {

        MEU_CARRINHO = $.grep(MEU_CARRINHO, (e, i) => { return e.id != id});
        catalogo.metodos.carregarCarrinho();

        // atualiza o botão carrinho com a qntd atualizada
        catalogo.metodos.atualizarBadgeTotal();

    },

    // atualiza o carrinho com a qntd atual
    atualizarCarrinho: (id, qntd) => {

        let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
        MEU_CARRINHO[objIndex].qntd = qntd;

        // atualiza o botão carrinho com a qntd atualizada
        catalogo.metodos.atualizarBadgeTotal();

        // atualiza os valorees R$ totais do carrinho
        catalogo.metodos.carregarValores();

    },

    // carrega os valores do subtotal, entrega e total
    carregarValores: () => {

        VALOR_CARRINHO = 0;

        $("#IblSubtotal").text('R$ 0,00');
        $("#lblValorEntrega").text('+ R$ 0,00');
        $("#IblValorTotal").text('R$ 0,00');

        $.each(MEU_CARRINHO, (i, e) => {
            VALOR_CARRINHO += parseFloat(e.price * e.qntd);

            if ((i + 1) == MEU_CARRINHO.length) {
                $("#IblSubtotal").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace('.', ',')}`);
                $("#lblValorEntrega").text(`+ R$ ${VALOR_ENTREGA.toFixed(2).replace('.', ',')}`);
                $("#IblValorTotal").text(`R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}`);
            }
        })

    },

    // carregar a etapa enderecos
    carregarEndereco: () => {
        if (MEU_CARRINHO.length <= 0) {
            catalogo.metodos.mensagem('Seu carrinho está vazio.')
            return;
        }

        catalogo.metodos.carregarEtapa(2);
    },

    // API viacep
    buscarCep: () => {
        // cria a variavel com o valor do CEP
        var cep = $("#txtCEP").val().trim().replace(/\D/g, '');

        //verifica se o CEP possui valor
        if (cep != "") {

            // validador de CEP
            var validaCep = /^[0-9]{8}$/;

            if(validaCep.test(cep)) {
                
                $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (dados) {

                    if (!("erro" in dados)) {

                        // atualizar os campos com os valores retornados
                        $("#txtEndereco").val(dados.logradouro);                    
                        $("#txtBairro").val(dados.bairro);
                        $("#txtCidade").val(dados.localidade);
                        $("#ddlUf").val(dados.uf);
                        $("#txtNumero").focus();

                    } else {
                        catalogo.metodos.mensagem('CEP não encontrado. Preencha as informações manualmente.');
                        $("#txtEndereco").focus();
                    }
                })

            } else {
                catalogo.metodos.mensagem('Formato do CEP inválido.');
                $("#txtCEP").focus();
            }

        } else {
            catalogo.metodos.mensagem('Informe o CEP, por favor.');
            $("#txtCEP").focus();
        }
    },

    // validacao antes de prosseguir para etapa 3
    resumoPedido: () => {

        let cep = $("#txtCEP").val().trim();
        let endereco = $("#txtEndereco").val().trim();
        let bairro = $("#txtBairro").val().trim();
        let cidade = $("#txtCidade").val().trim();
        let uf = $("#ddlUf").val().trim();
        let numero = $("#txtNumero").val().trim();
        let complemento = $("#txtComplemento").val().trim();

        if (cep.length <= 0) {
            catalogo.metodos.mensagem('Informe o CEP, por favor.')
            $("#txtCEP").focus();
            return;
        }

        if (endereco.length <= 0) {
            catalogo.metodos.mensagem('Informe o endereço, por favor.')
            $("#txtEndereco").focus();
            return;
        }

        if (bairro.length <= 0) {
            catalogo.metodos.mensagem('Informe o bairro, por favor.')
            $("#txtBairro").focus();
            return;
        }

        if (cidade.length <= 0) {
            catalogo.metodos.mensagem('Informe a cidade, por favor.')
            $("#txtCidade").focus();
            return;
        }

        if (uf == "-1") {
            catalogo.metodos.mensagem('Informe a UF, por favor.')
            $("#ddlUf").focus();
            return;
        }

        if (numero.length <= 0) {
            catalogo.metodos.mensagem('Informe o número, por favor.')
            $("#txtNumero").focus();
            return;
        }

        MEU_ENDERECO = {
            cep: cep,
            endereco: endereco,
            bairro: bairro,
            cidade: cidade,
            uf: uf,
            numero: numero,
            complemento: complemento
        }

        catalogo.metodos.carregarEtapa(3);
        catalogo.metodos.carregarResumo();

    },

    // carrega a etapa 3
    carregarResumo: () => {

        $("#listaItensResumo").html('');

        $.each(MEU_CARRINHO, (i, e) => {
            let temp = catalogo.templates.itemResumo
            .replace(/\${img}/g, e.img)
            .replace(/\${name}/g, e.name)
            .replace(/\${price}/g, e.price.toFixed(2).replace('.', ','))
            .replace(/\${qntd}/g, e.qntd)

            $("#listaItensResumo").append(temp);
        });

        $("#resumoEndereco").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`);
        $("#cidadeEndereco").html(`${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`);

        catalogo.metodos.finalizarPedido();

    },


    finalizarPedido: () => {

        if (MEU_CARRINHO.length > 0 && MEU_ENDERECO != null) {

            var texto = 'Olá! gostaria de fazer um pedido:';
            texto += `\n*Itens do pedido:*\n\n\${itens}`;
            texto += '\n*Endereço de entrega:*';
            texto += `\n${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`;
            texto += `\n${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`;
            texto += `\n\n*Total (com entrega): R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}*`;

            var itens = '';

            $.each(MEU_CARRINHO, (i, e) => {
                itens += `*${e.qntd}x* ${e.name} ....... R$ ${e.price.toFixed(2).replace('.', ',')} \n`

                if ((i + 1) == MEU_CARRINHO.length) {

                    texto = texto.replace(/\${itens}/g, itens);

                    // convertendo URL
                    let encode = encodeURI(texto);
                    let URL = `https://wa.me/${CELULAR_CUPLY}?text=${encode}`;

                    $("#btnEtapaResumo").attr('href', URL);

                }
            })
        }
    },

    // carrega o link do btn reserva
    carregarBtnReserva: () => {

      var texto = 'Olá! Gostaria de personalizar uma *caneca* 😊'; 

      let encode = encodeURI(texto);
      let URL = `https://wa.me/${CELULAR_CUPLY}?text=${encode}`;

      $("#btnReserva").attr('href', URL);
      $("#btnWpp").attr('href', URL);

    },

    // carrega o btn de ligar
    carregarBtnLigar: () => {
        $("#btnLigar").attr('href', `tel:${CELULAR_CUPLY}`);
    },

    // abre o depoimento
    abrirDepoimento: (depoimento) => {

        $("#depoimento-1").addClass('hidden');
        $("#depoimento-2").addClass('hidden');
        $("#depoimento-3").addClass('hidden');

        $("#btnDepoimento-1").removeClass('active');
        $("#btnDepoimento-2").removeClass('active');
        $("#btnDepoimento-3").removeClass('active');

        $("#depoimento-" + depoimento).removeClass('hidden');
        $("#btnDepoimento-" + depoimento).removeClass('active');
    },


    // mensagens
    mensagem: (texto, cor = 'red', tempo = 3500) => {

        let id = Math.floor(Date.now() * Math.random()).toString();

        let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`

        $("#container-mensagens").append(msg);

        setTimeout(() => {
            $("#msg-" + id).removeClass('fadeInDown');
            $("#msg-" + id).addClass('fadeOutUp');
            setTimeout(() => {
                $("#msg-" + id).remove();
            }, 800);
        }, tempo);

    }
}

catalogo.templates = {

    item: `
        <div class="col-12 col-lg-3 col-md-3 col-sm-6 mb-5 animated fadeInUp">
            <div class="card card-item" id="\${id}" >
                <div class="img-produto">
                    <img src="\${img}" class="abrir-imagem" data-id="\${id}" />
                </div>
                <p class="title-produto text-center mt-4">
                    <b>\${name}</b>
                </p>
                <p class="price-produto text-center">
                    <b>R$ \${price}</b>
                </p>
                <div class="add-carrinho">
                    <span class="btn-menos" onclick="catalogo.metodos.diminuirQuantidade('\${id}')"><i class="fas fa-minus"></i></span>
                    <span class="add-numero-itens" id="qntd-\${id}">0</span>
                    <span class="btn-mais" onclick="catalogo.metodos.aumentarQuantidade('\${id}')"><i class="fas fa-plus"></i></span>
                    <span class="btn btn-add" onclick="catalogo.metodos.adicionarAoCarrinho('\${id}')"><i class="fas fa-cart-plus"></i></span>
                </div>
            </div>
        </div>       
    `,

    itemCarrinho: `
        <div class="col-12 item-carrinho">
            <div class="img-produto">
                <img src="\${img}" class="abrir-imagem" data-id="\${id}" />
            </div>
            <div class="dados-produto">
                <p class="title-produto"><b>\${name}</b></p>
                <p class="price-produto"><b>R$ \${price}</b></p>
            </div>
            <div class="add-carrinho">
                <span class="btn-menos" onclick="catalogo.metodos.diminuirQuantidadeCarrinho('\${id}')"><i class="fas fa-minus"></i></span>
                <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
                <span class="btn-mais" onclick="catalogo.metodos.aumentarQuantidadeCarrinho('\${id}')"><i class="fas fa-plus"></i></span>
                <span class="btn btn-remove" onclick="catalogo.metodos.removerItemCarrinho('\${id}')"><i class="fa fa-times"></i></span>
            </div>
        </div>
    `,

    itemResumo: `
        <div class="col-12 item-carrinho resumo">
            <div class="img-produto-resumo">
                <img src="\${img}">
            </div>
            <div class="dados-produto">
                <p class="title-produto-resumo">
                    <b>\${name}</b>
                </p>
                <p class="price-produto-resumo">
                    <b>R$ \${price}</b>
                </p>
                </div>
                <p class="quantidade-produto-resumo">
                    x <b>\${qntd}</b>
                </p>
        </div>
    `
}