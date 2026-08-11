package main

import (
	"fmt"
	"strings"
)

type DeviceConfig struct {
	Template string
	IsRouter bool
}

func ConfigForRole(role string) DeviceConfig {
	switch role {
	case "pc":
		return DeviceConfig{
			IsRouter: false,
		}
	case "router":
		return DeviceConfig{
			IsRouter: true,
		}
	case "webserver":
		return DeviceConfig{
			IsRouter: false,
		}
	case "fileserver":
		return DeviceConfig{
			IsRouter: false,
		}
	case "bot":
		return DeviceConfig{
			IsRouter: false,
		}
	case "botrouter":
		return DeviceConfig{
			IsRouter: true,
		}
	default:
		return DeviceConfig{
			IsRouter: false,
		}
	}
}

func IsRouter(role string) bool {
	return ConfigForRole(role).IsRouter
}
func writeTemplate(b *strings.Builder, role string) {
	config := ConfigForRole(role)

	if config.Template != "" {
		b.WriteString(config.Template)
	} else if config.IsRouter {
		b.WriteString(fmt.Sprintf(`x-%[1]s-template: &%[1]s_template
  build:
    context: ./%[1]s
  sysctls:
    net.ipv4.ip_forward: "1"
    net.ipv4.conf.all.rp_filter: "0"
    net.ipv4.conf.default.rp_filter: "0"
  cap_add:
    - NET_ADMIN
    - NET_RAW

`, role))
	} else {
		b.WriteString(fmt.Sprintf(`x-%[1]s-template: &%[1]s_template
  build:
    context: ./%[1]s
  cap_add:
    - NET_ADMIN
    - NET_RAW

`, role))
	}
}
