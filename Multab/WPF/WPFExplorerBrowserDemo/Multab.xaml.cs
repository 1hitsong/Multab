//Copyright (c) Microsoft Corporation.  All rights reserved.

using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Data;
using System.Windows.Controls;
using System.Linq;

using Microsoft.WindowsAPICodePack.Shell;
using Microsoft.WindowsAPICodePack.Controls;
using System.Windows.Markup;
using System.IO;
using System.Xml;
using Microsoft.WindowsAPICodePack.Controls.WindowsForms;
using System.Windows.Media;
using System.Windows.Input;

namespace MulTab
{
    /// <summary>
    /// Interaction logic for Window1.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        List<Microsoft.WindowsAPICodePack.Controls.WindowsPresentationFoundation.ExplorerBrowser> eb = new List<Microsoft.WindowsAPICodePack.Controls.WindowsPresentationFoundation.ExplorerBrowser>();

        public MainWindow()
        {
            InitializeComponent();

            var sortedKnownFolders =
                from folder in KnownFolders.All
                where (folder.CanonicalName != null &&
                    folder.CanonicalName.Length > 0 &&
                    ((ShellObject)folder).Thumbnail.BitmapSource != null &&
                    folder.CanonicalName.CompareTo("Network") != 0 &&
                    folder.CanonicalName.CompareTo("NetHood") != 0)
                orderby folder.CanonicalName
                select folder;

            this.Loaded += new RoutedEventHandler(MulTabWindow_Loaded);
        }

        void MulTabWindow_Loaded(object sender, RoutedEventArgs e)
        {
            TabItem item = new TabItem();
            item.Header = "Explorer";
            tabControl1.Items.Add(item);
            tabControl1.SelectedIndex = tabControl1.Items.Count - 1;

            tabControl1.SelectionChanged += TabControl1_SelectionChanged;
        }

        private void TabControl1_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (tabControl1.SelectedIndex == -1)
            {
                if (tabControl1.Items.Count == 0)
                {
                    TabItem item = new TabItem();
                    item.Header = "Explorer";
                    tabControl1.Items.Add(item);
                    tabControl1.SelectedIndex = tabControl1.Items.Count - 1;
                }
                else
                {
                    tabControl1.SelectedIndex = 0;
                }
                
            }

            if (eb.Count >= tabControl1.SelectedIndex + 1)
            {
                textBox.Text = eb.ElementAt(tabControl1.SelectedIndex).NavigationLog.Last().ParsingName;
            }
        }

        private void TabItem_Loaded(object sender, RoutedEventArgs e)
        {
            var tabItem = (sender as TabItem);

            if (null != tabItem.DataContext)
            {
                eb.Add(new Microsoft.WindowsAPICodePack.Controls.WindowsPresentationFoundation.ExplorerBrowser());
                eb.Last().ExplorerBrowserControl.NavigationLog.NavigationLogChanged += NavigationLog_NavigationLogChanged; ;
                tabItem.Content = eb.ElementAt(tabControl1.SelectedIndex);
            }
        }


        private void NavigationLog_NavigationLogChanged(object sender, NavigationLogEventArgs e)
        {
            textBox.Text = eb.ElementAt(tabControl1.SelectedIndex).NavigationLog.Last().ParsingName;
        }

        private void newTab_Click(object sender, RoutedEventArgs e)
        {
            CreateNewTab();
        }

        private void CreateNewTab()
        {
            TabItem item = new TabItem();
            item.Header = "Explorer";
            tabControl1.Items.Add(item);
            tabControl1.SelectedIndex = tabControl1.Items.Count - 1;
        }

        private void CloseTab()
        {
            tabControl1.Items.RemoveAt(tabControl1.SelectedIndex);
            eb.RemoveAt(tabControl1.SelectedIndex);
            tabControl1.SelectedIndex = tabControl1.Items.Count - 1;
        }

        private void closeTab_Click(object sender, RoutedEventArgs e)
        {
            CloseTab();
        }

        private void MulTabWindow_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.IsRepeat)
            {
                return;
            }

            if (e.Key == Key.T && Keyboard.IsKeyDown(Key.LeftCtrl))
            {
                CreateNewTab();
                e.Handled = true;
            }
            else if (e.Key == Key.W && Keyboard.IsKeyDown(Key.LeftCtrl))
            {
                CloseTab();
                e.Handled = true;
            }
        }

        private void textBox_KeyUp(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                ShellObject folderToGoTo;

                try
                {
                    folderToGoTo = ShellObject.FromParsingName(textBox.Text);
                    eb.ElementAt(tabControl1.SelectedIndex).ExplorerBrowserControl.Navigate(folderToGoTo);
                }
                catch(Exception ex)
                {
                }
            }
        }

        private void button_upOneFolder_Click(object sender, RoutedEventArgs e)
        {
            DirectoryInfo parentDirectory = Directory.GetParent(eb.ElementAt(tabControl1.SelectedIndex).NavigationLog.Last().ParsingName);

            if (parentDirectory != null)
            {
                eb.ElementAt(tabControl1.SelectedIndex).ExplorerBrowserControl.Navigate(ShellObject.FromParsingName(Directory.GetParent(eb.ElementAt(tabControl1.SelectedIndex).NavigationLog.Last().ParsingName).ToString()));
            }            
        }
    }

    public static class Enums
    {
        public static IEnumerable<T> Get<T>()
        {
            return System.Enum.GetValues(typeof(T)).Cast<T>();
        }
    }

    public class TriCheckToPaneVisibilityState : IValueConverter
    {
        #region IValueConverter Members

        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if (value == null)
                return PaneVisibilityState.DoNotCare;
            else if ((bool)value == true)
                return PaneVisibilityState.Show;
            else
                return PaneVisibilityState.Hide;
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            if ((PaneVisibilityState)value == PaneVisibilityState.DoNotCare)
                return null;
            else if ((PaneVisibilityState)value == PaneVisibilityState.Show)
                return true;
            else
                return false;
        }

        #endregion
    }

}
