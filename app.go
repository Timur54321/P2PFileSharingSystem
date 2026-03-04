package main

import (
	"context"
	"fmt"

	"github.com/libp2p/go-libp2p/core/host"
)

// App struct
type App struct {
	ctx  context.Context
	host host.Host
}

// NewApp creates a new App application struct
func NewApp(h host.Host) *App {
	return &App{
		host: h,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
