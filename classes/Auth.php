<?php
class Auth {
    private $conn;
    private $table_name = "usuarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($email, $senha) {
        $query = "SELECT id, nome, email, perfil FROM " . $this->table_name . " WHERE email = :email AND senha = :senha";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':senha', $senha);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        }
        return false;
    }

    public function verificarSessao() {
        session_start();
        if(!isset($_SESSION['usuario_id'])) {
            return false;
        }
        return $_SESSION;
    }

    public function logout() {
        session_start();
        session_destroy();
        return true;
    }
}
?>

