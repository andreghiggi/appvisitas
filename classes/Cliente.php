<?php
class Cliente {
    private $conn;
    private $table_name = "clientes";

    public $id;
    public $nome;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function criar() {
        $query = "INSERT INTO " . $this->table_name . " SET nome=:nome";
        $stmt = $this->conn->prepare($query);

        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $stmt->bindParam(":nome", $this->nome);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function listar() {
        $query = "SELECT id, nome FROM " . $this->table_name . " ORDER BY nome";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function buscarPorNome($nome) {
        $query = "SELECT id, nome FROM " . $this->table_name . " WHERE nome LIKE :nome ORDER BY nome";
        $stmt = $this->conn->prepare($query);
        $nome = "%{$nome}%";
        $stmt->bindParam(':nome', $nome);
        $stmt->execute();
        return $stmt;
    }

    public function buscarOuCriar($nome) {
        // Primeiro tenta buscar o cliente
        $query = "SELECT id FROM " . $this->table_name . " WHERE nome = :nome LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nome', $nome);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['id'];
        } else {
            // Se não encontrar, cria um novo
            $this->nome = $nome;
            if($this->criar()) {
                return $this->id;
            }
        }
        return false;
    }
}
?>

