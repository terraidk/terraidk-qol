let focus = false;

// put focus to true when anvil GUI is opened
register("guiOpened", (e) => {
    if (e.gui && e.gui.class.getSimpleName() === "GuiRepair") focus = true;
});

register("tick", () => {
    const gui = Client.currentGui.get();
    if (!gui || gui.class.getSimpleName() !== "GuiRepair") return;

    // get all fields of the GuiRepair class and find the text field to set focus on it
    if (focus) {
        gui.getClass()
            .getDeclaredFields()
            .forEach((f) => {
                try {
                    f.setAccessible(true);
                    const o = f.get(gui);
                    if (o && o.getClass().getSimpleName() === "GuiTextField") {
                        o.func_146192_a(0, 0, 0); // mouseClicked
                        o.func_146195_b(true); // setFocused
                        focus = false;
                    }
                } catch (e) {}
            });
    }

    if (Keyboard.isKeyDown(Keyboard.KEY_RETURN)) {
        const s = Player.getContainer().getStackInSlot(2);
        if (s) Player.getContainer().click(2, false, "LEFT");
    }
});
