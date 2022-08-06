import time

from rich.progress import Progress

with Progress() as progress:

    task1 = progress.add_task("[red]Downloading...", total=1000)
    task2 = progress.add_task("[green]Processing...", total=1000)
    task3 = progress.add_task("[cyan]Cooking...", total=1000)

    i =0
    while not progress.finished:
        i+=1
        # progress.update(task1, completed=i, total = 100)
        # progress.update(task2, advance=0.3)
        # progress.update(task3, advance=0.9)
        time.sleep(0.02)