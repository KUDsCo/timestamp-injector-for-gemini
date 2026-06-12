#!/usr/bin/env python3
import json
import argparse
from datetime import datetime

def load_har(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_network_events(har):
    events = []
    pages = har.get('log', {}).get('pages', [])
    default_page_time = None
    if pages:
        default_page_time = pages[0].get('startedDateTime')
    for entry in har.get('log', {}).get('entries', []):
        url = entry.get('request', {}).get('url', '')
        method = entry.get('request', {}).get('method', '')
        started = entry.get('startedDateTime') or default_page_time
        time_ms = entry.get('time')
        if any(k in url for k in ('batchexecute', 'upload', 'content-push', 'data/batchexecute')) or method.upper()=='POST':
            events.append({
                'type': 'network',
                'url': url,
                'method': method,
                'time': started,
                'duration_ms': time_ms
            })
    return events

def extract_console_events(console_path):
    events = []
    with open(console_path, 'r', encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f, start=1):
            if ('RuntimeError' in line) or ('memory access out of bounds' in line) or ('Aborted(' in line):
                events.append({
                    'type': 'console',
                    'line': i,
                    'message': line.strip()
                })
    return events

def write_csv(events, out_path):
    import csv
    keys = ['stamp','type','url','method','duration_ms','line','message']
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for e in events:
            w.writerow(e)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--har', required=True)
    p.add_argument('--console', required=True)
    p.add_argument('--out', default='analysis.csv')
    args = p.parse_args()

    har = load_har(args.har)
    net = extract_network_events(har)
    con = extract_console_events(args.console)

    # Normalize network times to iso stamps if present
    combined = []
    for n in net:
        stamp = n.get('time')
        combined.append({
            'stamp': stamp or '',
            'type': 'network',
            'url': n.get('url',''),
            'method': n.get('method',''),
            'duration_ms': n.get('duration_ms') or '',
            'line': '',
            'message': ''
        })
    for c in con:
        combined.append({
            'stamp': '',
            'type': 'console',
            'url': '',
            'method': '',
            'duration_ms': '',
            'line': c['line'],
            'message': c['message']
        })

    # Try to sort by stamp where available
    def keyfun(e):
        s = e.get('stamp')
        if s:
            try:
                return datetime.fromisoformat(s.replace('Z','+00:00'))
            except Exception:
                return datetime.max
        return datetime.max

    combined.sort(key=keyfun)

    write_csv(combined, args.out)
    print(f'Wrote {len(combined)} events to {args.out}')

if __name__ == '__main__':
    main()
