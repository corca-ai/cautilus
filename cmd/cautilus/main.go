package main

import (
	"os"

	"github.com/corca-ai/cautilus/internal/app"
)

func main() {
	os.Exit(app.Run(os.Args[1:], os.Stdout, os.Stderr))
}
