# Import all plugins from `rel/plugins`
# They can then be used by adding `plugin MyPlugin` to
# either an environment, or release definition, where
# `MyPlugin` is the name of the plugin module.
Path.join(["rel", "plugins", "*.exs"])
|> Path.wildcard()
|> Enum.map(&Code.eval_file(&1))

use Mix.Releases.Config,
    # This sets the default release built by `mix release`
    default_release: :default,
    # This sets the default environment used by `mix release`
    default_environment: Mix.env()

# For a full list of config options for both releases
# and environments, visit https://hexdocs.pm/distillery/configuration.html


# You may define one or more environments in this file,
# an environment's settings will override those of a release
# when building in that environment, this combination of release
# and environment configuration is called a profile

environment :dev do
  # If you are running Phoenix, you should make sure that
  # server: true is set and the code reloader is disabled,
  # even in dev mode.
  # It is recommended that you build with MIX_ENV=prod and pass
  # the --env flag to Distillery explicitly if you want to use
  # dev mode.
  set dev_mode: true
  set include_erts: false
  set cookie: :"6=e1x}GQ^Ks>*u{MGCU*<6}4z9giA,q$QCm7;4k&iV;%aSc}vPS8ffX<((t7unWf"
end

environment :prod do
  set include_erts: true
  set include_src: false
  set cookie: :"GNon%8:0_.uV,ey2p,L9$ezJ%:PWN?HD^W%/jwKD=15k.<`@KpenAY$C$&IQa$Me"
end

# You may define one or more releases in this file.
# If you have not set a default release, or selected one
# when running `mix release`, the first release in the file
# will be used by default

release :ucx_ucc do
  set version: current_version(:ucx_ucc)
  set applications: [
    :runtime_tools,
    :logger,
    :coherence,
    :earmark,
    :exjsx,
    :gen_state_machine_helpers,
    :neotoma,
    :sbroker,
    :ucx_license_manager,
    :elixir_make
  ]
  set commands: [
    "migrate": "rel/commands/migrate.sh",
    "setup": "rel/commands/setup.sh",
    "create":  "rel/commands/create.sh",
    "drop_database": "rel/commands/drop_database.sh"
  ]
  plugin UcxUcc.MigrationsPlugin
end

