defmodule UcxUcc.Repo.Migrations.CreateCoherenceUser do
  use Ecto.Migration
  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :name, :string
      add :email, :string
      add :username, :string
      add :alias, :string
      add :avatar_url, :string
      add :tz_offset, :integer

      # rememberable
      add :remember_created_at, :utc_datetime
      # trackable
      add :sign_in_count, :integer, default: 0
      add :current_sign_in_at, :utc_datetime
      add :last_sign_in_at, :utc_datetime
      add :current_sign_in_ip, :string
      add :last_sign_in_ip, :string
      # unlockable_with_token
      add :unlock_token, :string
      # recoverable
      add :reset_password_token, :string
      add :reset_password_sent_at, :utc_datetime
      # lockable
      add :failed_attempts, :integer, default: 0
      add :locked_at, :utc_datetime
      # authenticatable
      add :password_hash, :string
      #confimrable
      add :confirmation_token, :string
      add :confirmed_at, :utc_datetime
      add :confirmation_sent_at, :utc_datetime

      add :active, :boolean, default: true
      add :tag_line, :string, default: ""
      add :uri, :string, default: ""

      timestamps(type: :utc_datetime)
    end
    create unique_index(:users, [:username])
    create unique_index(:users, [:alias])
    create unique_index(:users, [:email])

  end
end