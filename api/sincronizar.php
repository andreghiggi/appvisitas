<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../classes/Visita.php';
include_once '../classes/Cliente.php';
include_once '../classes/Auth.php';

$database = new Database();
$db = $database->getConnection();
$visita = new Visita($db);
$cliente = new Cliente($db);
$auth = new Auth($db);

// Verificar se o usuário está logado
session_start();
if(!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Acesso negado. Faça login primeiro."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(!empty($data->visitas) && is_array($data->visitas)) {
        $sucessos = 0;
        $erros = 0;
        $detalhes = array();
        
        foreach($data->visitas as $visita_data) {
            try {
                // Buscar ou criar cliente
                $id_cliente = $cliente->buscarOuCriar($visita_data->cliente_nome);
                
                if($id_cliente) {
                    $visita->id_vendedor = $_SESSION['usuario_id'];
                    $visita->id_cliente = $id_cliente;
                    $visita->data_hora = $visita_data->data_hora;
                    $visita->situacao = $visita_data->situacao;
                    $visita->observacoes = isset($visita_data->observacoes) ? $visita_data->observacoes : '';
                    $visita->retorno_data_hora = isset($visita_data->retorno_data_hora) ? $visita_data->retorno_data_hora : null;
                    
                    if($visita->criar()) {
                        $sucessos++;
                        $detalhes[] = array(
                            "cliente" => $visita_data->cliente_nome,
                            "status" => "sucesso",
                            "id" => $visita->id
                        );
                    } else {
                        $erros++;
                        $detalhes[] = array(
                            "cliente" => $visita_data->cliente_nome,
                            "status" => "erro",
                            "mensagem" => "Erro ao criar visita"
                        );
                    }
                } else {
                    $erros++;
                    $detalhes[] = array(
                        "cliente" => $visita_data->cliente_nome,
                        "status" => "erro",
                        "mensagem" => "Erro ao processar cliente"
                    );
                }
            } catch(Exception $e) {
                $erros++;
                $detalhes[] = array(
                    "cliente" => isset($visita_data->cliente_nome) ? $visita_data->cliente_nome : "Desconhecido",
                    "status" => "erro",
                    "mensagem" => $e->getMessage()
                );
            }
        }
        
        http_response_code(200);
        echo json_encode(array(
            "message" => "Sincronização concluída",
            "sucessos" => $sucessos,
            "erros" => $erros,
            "detalhes" => $detalhes
        ));
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Array de visitas é obrigatório."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Método não permitido."));
}
?>

