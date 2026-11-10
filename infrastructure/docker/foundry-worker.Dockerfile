FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/foundry.tar.gz \
    https://github.com/foundry-rs/foundry/releases/download/v1.9.0/foundry_v1.9.0_linux_amd64.tar.gz \
    && echo '8d17599b42e3139f1a9c171be3798c4ed8e743ae17b84cc3435e57bf2a51ae99  /tmp/foundry.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/foundry.tar.gz -C /usr/local/bin forge \
    && rm /tmp/foundry.tar.gz

WORKDIR /workspace
ENV HOME=/workspace
COPY foundry.toml ./
COPY src/ ./src/
COPY contracts/evm/ ./contracts/evm/
COPY test/ ./test/
RUN forge --version && forge build && forge test --match-contract TrustedVaultTest
RUN chmod -R a+rX /workspace
USER 10001:10001
ENTRYPOINT ["forge"]
