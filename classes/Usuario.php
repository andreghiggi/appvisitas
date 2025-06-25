<?php
class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public $id;
    public $nome;
    public $email;
    public $senha;
    public $perfil;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function criar() {
        $query = "INSERT INTO " . $this->table_name . " SET nome=:nome, email=:email, senha=:senha, perfil=:perfil";
        $stmt = $this->conn->prepare($query);

        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->senha = htmlspecialchars(strip_tags($this->senha));
        $this->perfil = htmlspecialchars(strip_tags($this->perfil));

        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":senha", $this->senha);
        $stmt->bindParam(":perfil", $this->perfil);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function listar() {
        $query = "SELECT id, nome, email, perfil FROM " . $this->table_name . " ORDER BY nome";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function listarVendedores() {
        $query = "SELECT id, nome, email FROM " . $this->table_name . " WHERE perfil = 'vendedor' ORDER BY nome";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function buscarPorId() {
        $query = "SELECT id, nome, email, perfil FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->nome = $row['nome'];
            $this->email = $row['email'];
            $this->perfil = $row['perfil'];
            return true;
        }
        return false;
    }

    public function atualizar() {
        $query = "UPDATE " . $this->table_name . " SET nome=:nome, email=:email";
        
        if(!empty($this->senha)) {
            $query .= ", senha=:senha";
        }
        
        $query .= " WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);

        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(':nome', $this->nome);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':id', $this->id);
        
        if(!empty($this->senha)) {
            $this->senha = htmlspecialchars(strip_tags($this->senha));
            $stmt->bindParam(':senha', $this->senha);
        }

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

