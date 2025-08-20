{ pkgs, ... }: {
  channel = "stable-24.05"; # atau "unstable" kalau butuh versi terbaru

  # Paket yang akan diinstal di environment
  packages = [
    pkgs.python3
  ];

  idx = {
    extensions = [
      # Bisa tambahkan ekstensi editor di sini
      # "vscodevim.vim"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          # Jalankan server bawaan Python untuk serve file statis
          command = ["python3" "-m" "http.server" "$PORT"];
          manager = "web";
          # path = "."; # default dari root project
        };
      };
    };

    workspace = {
      onCreate = {
        # Misalnya langsung buka file index.html & manifest.json saat project dibuat
        default.openFiles = [ "index.html" "manifest.json" ".idx/dev.nix" ];
      };
    };
  };
}
