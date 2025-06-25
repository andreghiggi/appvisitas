<?php
class Visita {
    private $conn;
    private $table_name = "visitas";

    public $id;
    public $id_vendedor;
    public $id_cliente;
    public $data_hora;
    public $situacao;
    public $observacoes;
    public $retorno_data_hora;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function criar() {
        $query = "INSERT INTO " . $this->table_name . " SET id_vendedor=:id_vendedor, id_cliente=:id_cliente, data_hora=:data_hora, situacao=:situacao, observacoes=:observacoes, retorno_data_hora=:retorno_data_hora";
        $stmt = $this->conn->prepare($query);

        $this->id_vendedor = htmlspecialchars(strip_tags($this->id_vendedor));
        $this->id_cliente = htmlspecialchars(strip_tags($this->id_cliente));
        $this->data_hora = htmlspecialchars(strip_tags($this->data_hora));
        $this->situacao = htmlspecialchars(strip_tags($this->situacao));
        $this->observacoes = htmlspecialchars(strip_tags($this->observacoes));
        $this->retorno_data_hora = $this->retorno_data_hora ? htmlspecialchars(strip_tags($this->retorno_data_hora)) : null;

        $stmt->bindParam(":id_vendedor", $this->id_vendedor);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->bindParam(":data_hora", $this->data_hora);
        $stmt->bindParam(":situacao", $this->situacao);
        $stmt->bindParam(":observacoes", $this->observacoes);
        $stmt->bindParam(":retorno_data_hora", $this->retorno_data_hora);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function listar($id_vendedor = null) {
        $query = "SELECT v.*, c.nome as cliente_nome, u.nome as vendedor_nome 
                  FROM " . $this->table_name . " v 
                  LEFT JOIN clientes c ON v.id_cliente = c.id 
                  LEFT JOIN usuarios u ON v.id_vendedor = u.id";
        
        if($id_vendedor) {
            $query .= " WHERE v.id_vendedor = :id_vendedor";
        }
        
        $query .= " ORDER BY v.data_hora DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if($id_vendedor) {
            $stmt->bindParam(':id_vendedor', $id_vendedor);
        }
        
        $stmt->execute();
        return $stmt;
    }

    public function listarPorPeriodo($data_inicio, $data_fim, $id_vendedor = null) {
        $query = "SELECT v.*, c.nome as cliente_nome, u.nome as vendedor_nome 
                  FROM " . $this->table_name . " v 
                  LEFT JOIN clientes c ON v.id_cliente = c.id 
                  LEFT JOIN usuarios u ON v.id_vendedor = u.id
                  WHERE DATE(v.data_hora) BETWEEN :data_inicio AND :data_fim";
        
        if($id_vendedor) {
            $query .= " AND v.id_vendedor = :id_vendedor";
        }
        
        $query .= " ORDER BY v.data_hora DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':data_inicio', $data_inicio);
        $stmt->bindParam(':data_fim', $data_fim);
        
        if($id_vendedor) {
            $stmt->bindParam(':id_vendedor', $id_vendedor);
        }
        
        $stmt->execute();
        return $stmt;
    }

    public function listarRetornos($id_vendedor, $data = null) {
        $query = "SELECT v.*, c.nome as cliente_nome 
                  FROM " . $this->table_name . " v 
                  LEFT JOIN clientes c ON v.id_cliente = c.id 
                  WHERE v.id_vendedor = :id_vendedor AND v.retorno_data_hora IS NOT NULL";
        
        if($data) {
            $query .= " AND DATE(v.retorno_data_hora) = :data";
        }
        
        $query .= " ORDER BY v.retorno_data_hora ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_vendedor', $id_vendedor);
        
        if($data) {
            $stmt->bindParam(':data', $data);
        }
        
        $stmt->execute();
        return $stmt;
    }

    public function buscarPorId() {
        $query = "SELECT v.*, c.nome as cliente_nome 
                  FROM " . $this->table_name . " v 
                  LEFT JOIN clientes c ON v.id_cliente = c.id 
                  WHERE v.id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id_vendedor = $row['id_vendedor'];
            $this->id_cliente = $row['id_cliente'];
            $this->data_hora = $row['data_hora'];
            $this->situacao = $row['situacao'];
            $this->observacoes = $row['observacoes'];
            $this->retorno_data_hora = $row['retorno_data_hora'];
            return true;
        }
        return false;
    }

    public function atualizar() {
        $query = "UPDATE " . $this->table_name . " SET 
                  id_cliente=:id_cliente, 
                  data_hora=:data_hora, 
                  situacao=:situacao, 
                  observacoes=:observacoes, 
                  retorno_data_hora=:retorno_data_hora 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);

        $this->id_cliente = htmlspecialchars(strip_tags($this->id_cliente));
        $this->data_hora = htmlspecialchars(strip_tags($this->data_hora));
        $this->situacao = htmlspecialchars(strip_tags($this->situacao));
        $this->observacoes = htmlspecialchars(strip_tags($this->observacoes));
        $this->retorno_data_hora = $this->retorno_data_hora ? htmlspecialchars(strip_tags($this->retorno_data_hora)) : null;
        $this->id = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(':id_cliente', $this->id_cliente);
        $stmt->bindParam(':data_hora', $this->data_hora);
        $stmt->bindParam(':situacao', $this->situacao);
        $stmt->bindParam(':observacoes', $this->observacoes);
        $stmt->bindParam(':retorno_data_hora', $this->retorno_data_hora);
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function excluir() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

